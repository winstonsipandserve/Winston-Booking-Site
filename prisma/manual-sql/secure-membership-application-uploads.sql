-- Master copy for 20260917010000_secure_membership_application_uploads.
-- Direct browser uploads use time-limited, server-issued URLs. Enforce the same
-- file-type and per-file size limits in Storage so a leaked upload URL cannot write
-- arbitrary content or a large object.
update storage.buckets
set
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png']::text[]
where id = 'membership-applications';
