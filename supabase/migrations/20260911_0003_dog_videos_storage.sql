-- ============================================================================
-- APPLIED to foster-portal (twsomyzkoggtuefecpew) on 2026-09-11. Unlike 0001
-- and 0002, this one was genuinely new: the project had zero storage buckets.
--
-- This is what "add social media videos of the dogs" runs on.
-- ============================================================================

-- PRIVATE, not public. A public bucket means any URL that ever leaks stays live
-- forever, and these are filmed inside a county shelter. The site serves them
-- through short-lived signed URLs instead.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'dog-videos',
  'dog-videos',
  false,
  209715200, -- 200 MB, about 3 minutes off a phone
  array['video/mp4','video/quicktime','video/webm','video/x-m4v']
)
on conflict (id) do nothing;

-- Team only, in both directions. Paths are <org_id>/<dog_id>/<filename>, so the
-- first path segment is the tenant and membership is checked against it.
create policy "dog videos: team read"
  on storage.objects for select to authenticated
  using (bucket_id = 'dog-videos'
         and private.is_org_member(((storage.foldername(name))[1])::uuid));

create policy "dog videos: team upload"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'dog-videos'
              and private.is_org_member(((storage.foldername(name))[1])::uuid));

create policy "dog videos: team replace"
  on storage.objects for update to authenticated
  using (bucket_id = 'dog-videos'
         and private.is_org_member(((storage.foldername(name))[1])::uuid));

create policy "dog videos: team delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'dog-videos'
         and private.is_org_member(((storage.foldername(name))[1])::uuid));
