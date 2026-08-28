-- Enables self-service membership renewal for already-activated members: a renewal has no
-- MembershipApplication, so both Membership.applicationId and MembershipPayment.applicationId
-- become optional, and MembershipPayment gains a direct customerId (previously only reachable
-- via application.customer) so it can be created for a renewal with no application at all
-- (see CLAUDE.md → Architecture Decisions → Membership payment model).
-- Master copy — the live copy of this SQL lives in the migration file of the same name.

-- AlterTable: add customer_id to membership_payments, backfilled from the existing
-- application_id join before being made required.
ALTER TABLE "membership_payments" ADD COLUMN "customer_id" TEXT;

UPDATE "membership_payments" mp
SET "customer_id" = ma."customer_id"
FROM "membership_applications" ma
WHERE mp."application_id" = ma."id";

ALTER TABLE "membership_payments" ALTER COLUMN "customer_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "membership_payments" ADD CONSTRAINT "membership_payments_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "membership_payments_customer_id_idx" ON "membership_payments"("customer_id");

-- AlterTable: application_id is no longer required — a renewal payment/membership has none.
ALTER TABLE "membership_payments" ALTER COLUMN "application_id" DROP NOT NULL;
ALTER TABLE "memberships" ALTER COLUMN "application_id" DROP NOT NULL;

-- AlterEnum: new ledger reason for a renewal credit grant (alongside the existing 'activation').
ALTER TYPE "CreditTransactionReason" ADD VALUE 'renewal';
