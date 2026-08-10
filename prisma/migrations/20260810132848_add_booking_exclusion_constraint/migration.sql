CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE bookings
  ADD CONSTRAINT booking_no_overlap
  EXCLUDE USING gist (
    resource_id WITH =,
    tsrange(start_time, end_time) WITH &&
  )
  WHERE (status <> 'cancelled');
