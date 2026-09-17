-- Three things the team asked for once they saw the real thing.

-- ── 1. Clips that arrive already finished ────────────────────────────────────
-- Some of what they post is edited before it ever reaches us: overlays burned
-- in, branding on, ready to go. Treating those as raw footage would send a
-- finished video back to a queue marked "needs editing" and somebody would redo
-- work that was already done.
alter table public.dog_videos
  add column if not exists has_overlays boolean not null default false;

comment on column public.dog_videos.has_overlays is
  'Uploader says this clip already has overlays and branding on it. Skips the edit step.';

-- ── 2. Team and admins can write the dog''s note ─────────────────────────────
-- dog_bio_overrides already existed for this. Two changes.
--
-- First, it was open to any org member, which since the volunteer role exists
-- would let somebody with a camera rewrite public copy. Dee''s call: team and
-- admins. Reading stays public, because this is the part the public is meant
-- to read.
drop policy if exists dog_bio_overrides_team_write on public.dog_bio_overrides;

create policy dog_bio_overrides_staff_write on public.dog_bio_overrides
  for all to authenticated
  using (private.is_org_staff(org_id))
  with check (private.is_org_staff(org_id));

-- Second, what it holds has changed meaning. It used to store a replacement for
-- the generated bio. The generated bio is going away: the page now shows the
-- county''s own notes, verbatim, because that is what people kept asking for and
-- because a written-up "story" makes behavioural claims in the shelter''s voice
-- that the shelter never made. What lives here now is the rescue speaking AS the
-- rescue, in its own labelled block, next to the record rather than on top of it.
comment on table public.dog_bio_overrides is
  'The rescue''s own words about a dog, shown beside the county record and clearly '
  'attributed to the rescue. Shape: {"note": "..."}. Team and admin write, public read.';
