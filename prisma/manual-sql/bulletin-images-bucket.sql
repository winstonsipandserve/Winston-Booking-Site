-- Public bucket: bulletin images render on the public /news page, so unlike the
-- private membership-applications bucket, anon/authenticated need read access.
-- Writes are still service-role only — no INSERT/UPDATE/DELETE policy is added,
-- mirroring the reference bucket's pattern (default-deny RLS on storage.objects
-- for anon/authenticated; only the service role, which bypasses RLS, can write).
insert into storage.buckets (id, name, public)
values ('bulletin-images', 'bulletin-images', true)
on conflict (id) do nothing;

create policy public_read_bulletin_images
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'bulletin-images');
