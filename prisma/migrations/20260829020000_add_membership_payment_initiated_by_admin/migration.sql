-- Tracks which admin (if any) initiated a manual "Send Renewal Link" action, for the same
-- per-action accountability reviewedById/performedById already give admin reviews/reschedules
-- (see CLAUDE.md → Architecture Decisions → Membership payment model). Null for self-service
-- renewal and the original application-flow payment — set only by this admin action.
-- Master copy at prisma/manual-sql/add-membership-payment-initiated-by-admin.sql.

-- AlterTable
ALTER TABLE "membership_payments" ADD COLUMN "initiated_by_admin_id" TEXT;

-- AddForeignKey
ALTER TABLE "membership_payments" ADD CONSTRAINT "membership_payments_initiated_by_admin_id_fkey" FOREIGN KEY ("initiated_by_admin_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "membership_payments_initiated_by_admin_id_idx" ON "membership_payments"("initiated_by_admin_id");
