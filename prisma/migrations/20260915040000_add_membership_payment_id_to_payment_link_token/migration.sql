-- Extends MembershipPaymentLinkToken to also gate the renewal payment link
-- (/membership/renew/[id] + POST /api/membership-payments/[id]/checkout), keyed by
-- membership_payment_id instead of application_id. Nullable, mutually-exclusive FKs on one
-- row rather than a second token table — the same choice already made for
-- Payment.bookingId/membershipId, for the same reason (real FK integrity per link kind).
-- Master copy at prisma/manual-sql/add-membership-payment-id-to-payment-link-token.sql.

-- AlterTable
ALTER TABLE "membership_payment_link_tokens" ALTER COLUMN "application_id" DROP NOT NULL;
ALTER TABLE "membership_payment_link_tokens" ADD COLUMN "membership_payment_id" TEXT;

-- CreateIndex
CREATE INDEX "membership_payment_link_tokens_membership_payment_id_idx" ON "membership_payment_link_tokens"("membership_payment_id");

-- AddForeignKey
ALTER TABLE "membership_payment_link_tokens" ADD CONSTRAINT "membership_payment_link_tokens_membership_payment_id_fkey" FOREIGN KEY ("membership_payment_id") REFERENCES "membership_payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
