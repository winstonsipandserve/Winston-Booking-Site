-- Adds Payment.paymongoFeeCentavos and Payment.paymongoNetAmountCentavos, captured from
-- the payment.paid webhook's fee/foreign_fee/net_amount fields. Nullable: null for
-- credit-covered bookings (no PayMongo transaction) and for bookings confirmed before
-- these columns existed — not backfilled. See CLAUDE.md.

-- AlterTable
ALTER TABLE "payments" ADD COLUMN "paymongo_fee_centavos" INTEGER;
ALTER TABLE "payments" ADD COLUMN "paymongo_net_amount_centavos" INTEGER;
