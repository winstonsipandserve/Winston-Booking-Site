-- Structured Booking Impact / Customer Action fields on Bulletin, additive alongside the
-- existing free-text impact/action columns (not a replacement). Nullable at the DB level,
-- required-ness enforced at the app layer, same pattern as affectedFacility/impact/action.
-- No RLS statement needed here — new columns on an existing table (`bulletins` already has
-- RLS deny-all from a prior migration).

CREATE TYPE "BulletinBookingImpact" AS ENUM ('NoImpact', 'LimitedAvailability', 'TemporarilyUnavailable', 'ScheduleChanges');
CREATE TYPE "BulletinCustomerAction" AS ENUM ('NoActionRequired', 'RescheduleBooking', 'ContactSupport', 'BookAnotherFacility', 'WaitForFurtherNotice');

ALTER TABLE "bulletins" ADD COLUMN "booking_impact" "BulletinBookingImpact";
ALTER TABLE "bulletins" ADD COLUMN "customer_action_type" "BulletinCustomerAction";
