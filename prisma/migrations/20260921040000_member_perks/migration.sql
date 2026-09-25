-- Guest passes and the birthday-month court hour for the September 2026 client update
-- (docs/business.md → Membership → Guest passes / Birthday-month court hour).
--
-- Allowances are derived from bookings, not counted on the membership: passes used in a
-- term are the sum of bookings.guest_passes_used over the member's slot-occupying bookings
-- inside the term, and the birthday hour is used when such a booking has
-- birthday_perk_applied. Date of birth is collected on the application and copied to the
-- customer when the activation payment is confirmed.
--
-- Existing applications are sample data (they predate the required date of birth) and are
-- deleted with their dependants, the same way the membership reset migration did.

DELETE FROM "membership_credit_transactions";
DELETE FROM "payments" WHERE "membership_id" IS NOT NULL;
DELETE FROM "memberships";
DELETE FROM "membership_payment_link_tokens";
DELETE FROM "membership_payments";
DELETE FROM "membership_applications";

ALTER TABLE "customers"
  ADD COLUMN "date_of_birth" DATE;

ALTER TABLE "membership_applications"
  ADD COLUMN "date_of_birth" DATE NOT NULL;

ALTER TABLE "bookings"
  ADD COLUMN "guest_passes_used" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "birthday_perk_applied" BOOLEAN NOT NULL DEFAULT false;
