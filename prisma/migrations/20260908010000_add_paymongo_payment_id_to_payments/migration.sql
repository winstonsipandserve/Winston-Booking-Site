-- Adds Payment.paymongoPaymentId: PayMongo's own payment-resource id (pay_xxx), captured
-- from the payment.paid webhook's payment resource id — distinct from paymongoPaymentIntentId
-- (pi_xxx) and paymongoCheckoutSessionId (cs_xxx). Nullable, unique. Existing rows stay null;
-- not backfilled. See CLAUDE.md.

-- AlterTable
ALTER TABLE "payments" ADD COLUMN "paymongo_payment_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "payments_paymongo_payment_id_key" ON "payments"("paymongo_payment_id");
