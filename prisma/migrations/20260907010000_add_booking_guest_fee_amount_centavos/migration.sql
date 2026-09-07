-- Adds Booking.guestFeeAmountCentavos: a snapshot of the guest fee actually charged at
-- booking time, already folded inside total_amount_centavos — this column exists only so
-- the guest fee can be broken back out for display (e.g. the confirmation receipt),
-- independent of any later GuestFeeRule edit. Grand-total math is unchanged everywhere;
-- this is purely an informational column. See CLAUDE.md.

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN "guest_fee_amount_centavos" INTEGER NOT NULL DEFAULT 0;

-- Backfill existing rows: guest_count * the (single) current GuestFeeRule rate. This is an
-- approximation for any booking whose guest fee was actually charged at a since-changed rate,
-- but it's the best available reconstruction since no rate history exists for older rows.
UPDATE "bookings"
SET "guest_fee_amount_centavos" = "guest_count" * (SELECT "amount_centavos" FROM "guest_fee_rules" LIMIT 1)
WHERE "guest_count" > 0;
