-- ============================================================================
-- BASELINE. Do NOT run this against the existing `foster-portal` project
-- (twsomyzkoggtuefecpew); its schema is already live and these statements
-- would fail on "relation already exists". This file is here for two reasons:
--
--   1. Disaster recovery. The schema was built straight into the Supabase
--      dashboard on 2026-08-11 and lived NOWHERE else. A free-tier project
--      that is deleted, or an account that lapses, would have taken all of it
--      with it. Now it is in git.
--   2. SOSHub. `org_id` is on every tenant table from day one, so a second
--      rescue is a reskin plus a row. This file is how that second project
--      gets stood up.
--
-- Verified column-for-column against production on 2026-09-11, including
-- nullability. Every future change goes in a NEW numbered file here first and
-- is applied from it. Never define a table in the dashboard again.
-- ============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tenancy
-- ---------------------------------------------------------------------------

create table public.orgs (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  name       text not null,
  site_url   text,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  full_name  text,
  phone      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.org_members (
  org_id     uuid not null references public.orgs (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role       text not null default 'team' check (role in ('team', 'admin')),
  created_at timestamptz not null default now(),
  primary key (org_id, profile_id)
);

create table public.team_invites (
  org_id     uuid not null references public.orgs (id) on delete cascade,
  email      text not null,
  role       text not null default 'team' check (role in ('team', 'admin')),
  invited_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  claimed_at timestamptz,
  claimed_by uuid references public.profiles (id) on delete set null,
  primary key (org_id, email)
);

-- ---------------------------------------------------------------------------
-- Applications
-- ---------------------------------------------------------------------------

create table public.applications (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.orgs (id) on delete cascade,
  profile_id      uuid not null references public.profiles (id) on delete cascade,
  status          text not null default 'draft'
                  check (status in ('draft','submitted','approved','denied','withdrawn')),
  -- Answers are ONE jsonb column keyed to src/lib/apply-flow.ts, not a
  -- row-per-field table. That file stays the single source of truth for the
  -- form, so a question change is a config edit with no migration.
  answers         jsonb not null default '{}'::jsonb,
  -- Only the fields that dog-matching queries on every page load are promoted
  -- to real columns.
  housing         text check (housing in ('own','rent','other')),
  landlord_ok     text check (landlord_ok in ('yes','not_yet','unsure')),
  weight_limit_lb integer,
  breed_restricted boolean not null default false,
  has_dogs        boolean,
  has_cats        boolean,
  has_kids        boolean,
  zip             text,
  submitted_at    timestamptz,
  reviewed_at     timestamptz,
  reviewed_by     uuid references public.profiles (id) on delete set null,
  denial_reason   text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  -- "Apply once" is a constraint, not a convention. Re-applying UPDATES the
  -- row; it cannot duplicate.
  unique (org_id, profile_id)
);

comment on column public.applications.weight_limit_lb is
  'A lease weight limit is a verifiable fact, so it HIDES dogs over the limit. Do not soften this to a warning.';
comment on column public.applications.breed_restricted is
  'A breed restriction only FLAGS dogs. County breed labels are a staff visual guess, so hiding on them would hide the wrong dogs.';

create index applications_org_status_idx on public.applications (org_id, status, submitted_at desc);

-- ---------------------------------------------------------------------------
-- Dogs: only what the TEAM controls. County status is deliberately NOT stored,
-- it is read live from the importer feed at render time so it cannot drift.
-- ---------------------------------------------------------------------------

create table public.dog_work_status (
  org_id            uuid not null references public.orgs (id) on delete cascade,
  dog_id            text not null,
  work_status       text not null default 'not_started'
                    check (work_status in ('not_started','filmed','posted','hands_raised','our_pull')),
  partner_rescue    text,
  saver_profile_id  uuid references public.profiles (id) on delete set null,
  team_notes        text,
  updated_by        uuid references public.profiles (id) on delete set null,
  updated_at        timestamptz not null default now(),
  primary key (org_id, dog_id)
);

comment on column public.dog_work_status.dog_id is
  'County ID as the shelter writes it, e.g. A5168681. Never a UUID.';

create table public.dog_bio_overrides (
  org_id    uuid not null references public.orgs (id) on delete cascade,
  dog_id    text not null,
  bio       jsonb not null,
  edited_by uuid references public.profiles (id) on delete set null,
  edited_at timestamptz not null default now(),
  primary key (org_id, dog_id)
);

create table public.hands_raised (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null references public.orgs (id) on delete cascade,
  dog_id         text not null,
  profile_id     uuid not null references public.profiles (id) on delete cascade,
  application_id uuid not null references public.applications (id) on delete cascade,
  status         text not null default 'raised'
                 check (status in ('raised','approved','denied','withdrawn')),
  denial_reason  text,
  raised_at      timestamptz not null default now(),
  reviewed_at    timestamptz,
  reviewed_by    uuid references public.profiles (id) on delete set null,
  unique (org_id, dog_id, profile_id)
);

create index hands_raised_org_dog_idx on public.hands_raised (org_id, dog_id, status);

create table public.dog_videos (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.orgs (id) on delete cascade,
  dog_id       text not null,
  storage_path text not null,
  mime_type    text,
  size_bytes   bigint,
  uploaded_by  uuid references public.profiles (id) on delete set null,
  uploaded_at  timestamptz not null default now()
);

create index dog_videos_org_dog_idx on public.dog_videos (org_id, dog_id, uploaded_at desc);

-- ---------------------------------------------------------------------------
-- Alerts. Email only in v1; sms_enabled exists so adding Twilio later is not
-- a migration.
-- ---------------------------------------------------------------------------

create table public.alert_prefs (
  profile_id    uuid not null references public.profiles (id) on delete cascade,
  org_id        uuid not null references public.orgs (id) on delete cascade,
  email_enabled boolean not null default true,
  sms_enabled   boolean not null default false,
  deadline_days integer not null default 2,
  weekly_digest boolean not null default true,
  paused        boolean not null default false,
  updated_at    timestamptz not null default now(),
  primary key (profile_id, org_id)
);

create table public.alert_log (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.orgs (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  dog_id     text not null,
  kind       text not null check (kind in ('deadline','weekly','hand_approved','hand_denied')),
  sent_at    timestamptz not null default now()
);

create index alert_log_dedupe_idx on public.alert_log (org_id, profile_id, dog_id, kind, sent_at desc);
