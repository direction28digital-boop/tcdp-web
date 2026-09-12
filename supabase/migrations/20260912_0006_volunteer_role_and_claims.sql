-- Separate "can film a dog" from "can read a stranger's home address".
--
-- Until now every policy on this schema was private.is_org_member(org_id), which
-- means one login tier: anybody Joann invites can read every application. That was
-- fine while the only members were the five people already reading WPForms Entries.
-- It stops being fine the moment we ask shelter volunteers to upload video, because
-- the pool of people holding a camera is much larger than the pool who should see
-- an applicant's address, phone number and vet reference.
--
-- So: a third role, below team. A volunteer can see dogs, claim one, upload video
-- and move work along. They cannot open the applications table at all.

-- ── Role ─────────────────────────────────────────────────────────────────────
alter table public.org_members  drop constraint if exists org_members_role_check;
alter table public.org_members  add  constraint org_members_role_check
  check (role in ('volunteer', 'team', 'admin'));

alter table public.team_invites drop constraint if exists team_invites_role_check;
alter table public.team_invites add  constraint team_invites_role_check
  check (role in ('volunteer', 'team', 'admin'));

-- Staff = team or admin. Deliberately a separate helper rather than a tweak to
-- is_org_member, so the two questions stay distinct at every call site: "are you
-- one of us" is not the same question as "may you read this person's file".
create or replace function private.is_org_staff(p_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1 from public.org_members
    where org_id = p_org_id
      and profile_id = auth.uid()
      and role in ('team', 'admin')
  );
$$;

revoke all on function private.is_org_staff(uuid) from public, anon;
grant execute on function private.is_org_staff(uuid) to authenticated;

-- ── Applicant data is staff-only ─────────────────────────────────────────────
drop policy if exists applications_team_read   on public.applications;
drop policy if exists applications_team_update on public.applications;

create policy applications_staff_read on public.applications
  for select to authenticated
  using (private.is_org_staff(org_id));

create policy applications_staff_update on public.applications
  for update to authenticated
  using (private.is_org_staff(org_id))
  with check (private.is_org_staff(org_id));

drop policy if exists application_notes_team_read  on public.application_notes;
drop policy if exists application_notes_team_write on public.application_notes;

create policy application_notes_staff_read on public.application_notes
  for select to authenticated
  using (private.is_org_staff(org_id));

create policy application_notes_staff_write on public.application_notes
  for insert to authenticated
  with check (
    private.is_org_staff(org_id)
    and author_id = (select auth.uid())
  );

-- hands_raised links a named person to a dog, so it follows the applications.
drop policy if exists hands_raised_team_read   on public.hands_raised;
drop policy if exists hands_raised_team_update on public.hands_raised;

create policy hands_raised_staff_read on public.hands_raised
  for select to authenticated
  using (private.is_org_staff(org_id));

create policy hands_raised_staff_update on public.hands_raised
  for update to authenticated
  using (private.is_org_staff(org_id))
  with check (private.is_org_staff(org_id));

-- dog_videos, dog_work_status, dog_bio_overrides and the dog-videos bucket keep
-- is_org_member on purpose. That is the volunteer's whole job.

-- ── Claiming ─────────────────────────────────────────────────────────────────
-- Two volunteers at the same shelter filming the same dog is wasted trips, and
-- worse, it means some other dog went unfilmed. A claim is a soft lock: visible
-- to everyone, expiring on its own, never blocking anybody who decides to
-- override it. Enforcing it would be wrong — the person standing in front of the
-- dog knows more than the row does.
alter table public.dog_work_status
  add column if not exists claimed_by  uuid references public.profiles(id) on delete set null,
  add column if not exists claimed_at  timestamptz;

-- "filmed" already existed but nothing sat between it and "posted", so a clip
-- waiting to be edited was indistinguishable from one nobody had touched.
alter table public.dog_work_status drop constraint if exists dog_work_status_work_status_check;
alter table public.dog_work_status add  constraint dog_work_status_work_status_check
  check (work_status in (
    'not_started',   -- nobody has been to see them
    'filmed',        -- raw clip uploaded, needs editing
    'edited',        -- overlays done, ready to post
    'posted',        -- live on Facebook
    'hands_raised',  -- somebody applied for this dog
    'our_pull'       -- TCDP is pulling them directly
  ));

create index if not exists dog_work_status_claimed_idx
  on public.dog_work_status (org_id, claimed_at desc)
  where claimed_by is not null;

-- ── Where the finished post lives ────────────────────────────────────────────
-- The portal is not the permanent home of a finished video; Facebook is. Keeping
-- the permalink costs nothing and it is what lets us delete raw clips on a timer
-- without losing the record that the dog was posted at all.
alter table public.dog_videos
  add column if not exists posted_url text,
  add column if not exists posted_at  timestamptz,
  add column if not exists note       text;
