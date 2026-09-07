-- Adds Booking.customerNameSnapshot / customerPhoneSnapshot: the name/phone actually
-- submitted for this specific booking at customer-attach time, independent of any later
-- change to the linked Customer row (e.g. a repeat booking under the same email with a
-- different name, or resolveCustomer's passwordHash-based freeze — see CLAUDE.md).
-- Master copy at prisma/manual-sql/booking-customer-snapshot.sql.

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN "customer_name_snapshot" TEXT;
ALTER TABLE "bookings" ADD COLUMN "customer_phone_snapshot" TEXT;

-- Backfill existing attached bookings from their currently-linked Customer row. Best-effort
-- historical accuracy only, same caveat as the guestFeeAmountCentavos backfill: if a linked
-- Customer's name/phone was itself already overwritten by an intervening mismatched booking
-- before this migration ran, that history isn't recoverable.
UPDATE "bookings" b
SET "customer_name_snapshot" = c."name",
    "customer_phone_snapshot" = c."phone"
FROM "customers" c
WHERE b."customer_id" = c."id"
  AND b."customer_id" IS NOT NULL
  AND b."customer_name_snapshot" IS NULL;
