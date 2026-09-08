-- Adds membership-credit top-up support to Payment: a Payment can now also represent a
-- top-up (membershipId set, bookingId null) via 3 methods — paymongo (self-service),
-- cash, or manual_online (both admin-logged, front-desk). See CLAUDE.md → Membership
-- credit ledger.
-- Master copy — the live copy of this SQL lives in the migration file of the same name.

-- AlterEnum
ALTER TYPE "PaymentMethod" ADD VALUE 'cash';
ALTER TYPE "PaymentMethod" ADD VALUE 'manual_online';

-- AlterEnum
ALTER TYPE "CreditTransactionReason" ADD VALUE 'top_up';

-- AlterEnum
ALTER TYPE "AdminActivityAction" ADD VALUE 'membership_credit_topup_added';

-- AlterEnum
ALTER TYPE "AdminActivityEntityType" ADD VALUE 'membership';

-- AlterTable
ALTER TABLE "payments"
  ADD COLUMN "membership_id" TEXT,
  ADD COLUMN "external_reference" TEXT,
  ADD COLUMN "admin_note" TEXT,
  ADD COLUMN "initiated_by_admin_id" TEXT;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "memberships"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_initiated_by_admin_id_fkey" FOREIGN KEY ("initiated_by_admin_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "payments_membership_id_idx" ON "payments"("membership_id");

-- CreateIndex
CREATE INDEX "payments_initiated_by_admin_id_idx" ON "payments"("initiated_by_admin_id");
