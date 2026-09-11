-- ============================================================================
-- BASELINE, part 2. Same warning as 0001: do not run against the existing
-- project, which already has these 27 policies and both helper functions.
--
-- Helpers, RLS, and the sign-in triggers.
--
-- The helpers live in a PRIVATE schema that is not API-exposed. In the first
-- build they sat in public and were callable by anon at
-- /rest/v1/rpc/is_org_member, which let a stranger probe membership. That was
-- the difference between 7 advisor warnings and 0. Do not move them back.
-- ============================================================================

create schema if not exists private;
revoke all on schema private from anon, authenticated;

create or replace function private.is_org_member(target_org uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.org_members m
    where m.org_id = target_org and m.profile_id = (select auth.uid())
  );
$$;

create or replace function private.is_org_admin(target_org uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.org_members m
    where m.org_id = target_org
      and m.profile_id = (select auth.uid())
      and m.role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- New sign-in: mint a profile, then claim any invite waiting on that address.
-- Nobody gets walked through anything. A volunteer signs in and is simply on
-- the team.
-- ---------------------------------------------------------------------------

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;

  insert into public.org_members (org_id, profile_id, role)
  select i.org_id, new.id, i.role
  from public.team_invites i
  where lower(i.email) = lower(new.email) and i.claimed_at is null
  on conflict (org_id, profile_id) do nothing;

  update public.team_invites i
     set claimed_at = now(), claimed_by = new.id
   where lower(i.email) = lower(new.email) and i.claimed_at is null;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- ---------------------------------------------------------------------------
-- RLS. Every table, no exceptions.
-- ---------------------------------------------------------------------------

alter table public.orgs              enable row level security;
alter table public.profiles          enable row level security;
alter table public.org_members       enable row level security;
alter table public.team_invites      enable row level security;
alter table public.applications      enable row level security;
alter table public.dog_work_status   enable row level security;
alter table public.dog_bio_overrides enable row level security;
alter table public.hands_raised      enable row level security;
alter table public.dog_videos        enable row level security;
alter table public.alert_prefs       enable row level security;
alter table public.alert_log         enable row level security;

-- orgs: slug and name are public branding. Readable by anyone, writable by nobody
-- through the API (changes go through a migration).
create policy orgs_read on public.orgs for select to anon, authenticated using (true);

-- profiles: your own, plus applicant profiles visible to their org's team.
create policy profiles_self_read on public.profiles for select to authenticated
  using (id = (select auth.uid()));
create policy profiles_self_update on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy profiles_team_read on public.profiles for select to authenticated
  using (exists (
    select 1 from public.applications a
    where a.profile_id = public.profiles.id and private.is_org_member(a.org_id)
  ));

-- org_members: members see their own org's roster.
create policy org_members_read on public.org_members for select to authenticated
  using (private.is_org_member(org_id));

-- team_invites: admins only. This table is a list of volunteers' email addresses.
create policy team_invites_admin on public.team_invites for all to authenticated
  using (private.is_org_admin(org_id)) with check (private.is_org_admin(org_id));

-- applications: the applicant owns their row; the team reads and reviews.
create policy applications_own on public.applications for all to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()));
create policy applications_team_read on public.applications for select to authenticated
  using (private.is_org_member(org_id));
create policy applications_team_update on public.applications for update to authenticated
  using (private.is_org_member(org_id)) with check (private.is_org_member(org_id));

-- Team-only tables. dog_work_status carries team_notes, which is where staff
-- shorthand about applicants and dogs ends up. It must never be applicant-readable.
create policy dog_work_status_team on public.dog_work_status for all to authenticated
  using (private.is_org_member(org_id)) with check (private.is_org_member(org_id));
create policy dog_bio_overrides_team on public.dog_bio_overrides for all to authenticated
  using (private.is_org_member(org_id)) with check (private.is_org_member(org_id));
create policy alert_log_team on public.alert_log for select to authenticated
  using (private.is_org_member(org_id));

-- dog_videos: the team manages them. Public dog pages read videos through the
-- server client, not through this policy.
create policy dog_videos_team on public.dog_videos for all to authenticated
  using (private.is_org_member(org_id)) with check (private.is_org_member(org_id));

-- hands_raised: the applicant raises and withdraws; the team reads and decides.
create policy hands_raised_own on public.hands_raised for all to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()));
create policy hands_raised_team_read on public.hands_raised for select to authenticated
  using (private.is_org_member(org_id));
create policy hands_raised_team_update on public.hands_raised for update to authenticated
  using (private.is_org_member(org_id)) with check (private.is_org_member(org_id));

-- alert_prefs: your own settings.
create policy alert_prefs_own on public.alert_prefs for all to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()));
