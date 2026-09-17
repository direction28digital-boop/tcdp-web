-- ============================================================================
-- APPLIED to foster-portal (twsomyzkoggtuefecpew) on 2026-09-12.
--
-- Which dog brought this person here.
--
-- The old WPForms application led with "Dog name or ID #" as free text, which is
-- why the team could never sort their queue: a name typed by a stranger is not
-- something you can join on. This splits the intent from the text.
--
-- Deliberately NOT modelled on hands_raised. That table is for someone browsing
-- the site and raising a hand on a specific dog, which can happen many times.
-- "Which dog brought you here" is one attribute of one application.
-- ============================================================================

alter table public.applications
  add column dog_interest text
    check (dog_interest in ('specific', 'any')),
  add column dog_raw text,
  add column dog_id text,
  add column dog_matched_by uuid references public.profiles (id) on delete set null,
  add column dog_matched_at timestamptz;

comment on column public.applications.dog_raw is
  'Verbatim applicant input. Never overwritten by a match: a wrong match has to stay traceable to what they actually typed.';
comment on column public.applications.dog_id is
  'County ID as the shelter writes it. Null with dog_interest=specific means UNMATCHED and needs a human, which is a queue item, not a silent failure.';

-- The two queries the Needs Attention screen runs on every load.
create index applications_dog_id_idx
  on public.applications (org_id, dog_id)
  where dog_id is not null;

create index applications_unmatched_idx
  on public.applications (org_id, submitted_at desc)
  where dog_interest = 'specific' and dog_id is null;
