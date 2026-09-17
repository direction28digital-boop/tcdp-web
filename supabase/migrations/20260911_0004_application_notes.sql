-- ============================================================================
-- APPLIED to foster-portal (twsomyzkoggtuefecpew) on 2026-09-11.
-- ============================================================================

-- Timestamped, attributed notes on an application.
--
-- This exists because of what the team was doing in WordPress: they had no
-- notes field, so they typed staff shorthand INTO the applicant's answer for
-- "Dog name or ID #" ("Roger, husky at East if his other application falls
-- through..."). That overwrites the applicant's real answer, says nothing about
-- who wrote it or when, and is why nobody could tell what had already been
-- chased. Notes are append-only and never touch the application itself.
create table public.application_notes (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null references public.orgs (id) on delete cascade,
  application_id uuid not null references public.applications (id) on delete cascade,
  author_id      uuid references public.profiles (id) on delete set null,
  body           text not null check (length(btrim(body)) > 0),
  created_at     timestamptz not null default now()
);

create index application_notes_app_idx
  on public.application_notes (application_id, created_at desc);

alter table public.application_notes enable row level security;

-- Team only, in both directions. An applicant must never read what volunteers
-- wrote about them, so there is deliberately no "own row" policy here.
create policy application_notes_team_read
  on public.application_notes for select to authenticated
  using (private.is_org_member(org_id));

create policy application_notes_team_write
  on public.application_notes for insert to authenticated
  with check (
    private.is_org_member(org_id)
    and author_id = (select auth.uid())
  );

-- Notes are a record, not a draft. No update or delete policy: a volunteer
-- cannot quietly rewrite what they said about an applicant three weeks ago.
