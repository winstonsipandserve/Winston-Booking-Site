-- Public bucket: transactional email templates (activation, and future rejection-notice/
-- forgot-password emails) reference static brand assets (logo) via a public URL embedded
-- in the email HTML, so anon/authenticated need read access, same as bulletin-images.
-- Writes are still service-role only — no INSERT/UPDATE/DELETE policy is added, mirroring
-- the reference bucket's pattern (default-deny RLS on storage.objects for anon/authenticated;
-- only the service role, which bypasses RLS, can write). Asset upload here is manual
-- (via the Supabase dashboard), not app-driven, so no app code needs write access either.
insert into storage.buckets (id, name, public)
values ('email-assets', 'email-assets', true)
on conflict (id) do nothing;

create policy public_read_email_assets
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'email-assets');
