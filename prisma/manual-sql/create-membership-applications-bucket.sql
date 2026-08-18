-- No anon/authenticated storage policies are added deliberately — only the service role
-- (which bypasses RLS) reads/writes this bucket, same trust model as DATABASE_URL bypassing
-- table RLS.
insert into storage.buckets (id, name, public)
values ('membership-applications', 'membership-applications', false)
on conflict (id) do nothing;
