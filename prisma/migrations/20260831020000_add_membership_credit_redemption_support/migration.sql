-- Adds full-or-nothing member-credit booking redemption support (see CLAUDE.md →
-- Architecture Decisions → Membership credit ledger). Master copy at
-- prisma/manual-sql/add-membership-credit-redemption-support.sql.

-- Add a debit reason for booking-covered-by-credit redemptions.
-- Existing rows (activation/renewal) are unaffected; purely additive.
ALTER TYPE "CreditTransactionReason" ADD VALUE 'booking_redemption';

-- Trace which booking a credit debit paid for. Nullable: existing activation/renewal
-- rows have no associated booking.
ALTER TABLE "membership_credit_transactions"
  ADD COLUMN "booking_id" TEXT REFERENCES "bookings"("id");

CREATE INDEX "membership_credit_transactions_booking_id_idx"
  ON "membership_credit_transactions" ("booking_id");

-- Distinguish how a Payment was actually settled. Defaults every existing row to
-- 'paymongo' (the only method that has ever existed) — no backfill needed.
CREATE TYPE "PaymentMethod" AS ENUM ('paymongo', 'membership_credit');
ALTER TABLE "payments"
  ADD COLUMN "method" "PaymentMethod" NOT NULL DEFAULT 'paymongo';
