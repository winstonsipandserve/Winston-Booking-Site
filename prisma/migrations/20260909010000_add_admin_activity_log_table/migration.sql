-- Adds AdminActivityLog: an immutable per-admin audit trail for admin-initiated
-- actions (membership application approve/reject, renewal-link sends, booking
-- reschedules), same shape as BookingReschedule/MembershipCreditTransaction —
-- no updatedAt, corrections are new rows, never edits to the original.
-- Master copy at prisma/manual-sql/admin-activity-log-table.sql.

-- CreateEnum
CREATE TYPE "AdminActivityAction" AS ENUM ('membership_application_approved', 'membership_application_rejected', 'membership_renewal_link_sent', 'booking_rescheduled');

-- CreateEnum
CREATE TYPE "AdminActivityEntityType" AS ENUM ('membership_application', 'booking');

-- CreateTable
CREATE TABLE "admin_activity_logs" (
    "id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "action" "AdminActivityAction" NOT NULL,
    "entity_type" "AdminActivityEntityType" NOT NULL,
    "entity_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "admin_activity_logs_admin_id_idx" ON "admin_activity_logs"("admin_id");

-- CreateIndex
CREATE INDEX "admin_activity_logs_created_at_idx" ON "admin_activity_logs"("created_at");

-- AddForeignKey
ALTER TABLE "admin_activity_logs" ADD CONSTRAINT "admin_activity_logs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RowLevelSecurity (Decision: Row Level Security — every new table enables RLS with deny-all policies in the same migration)
ALTER TABLE admin_activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY deny_all_anon ON admin_activity_logs FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY deny_all_authenticated ON admin_activity_logs FOR ALL TO authenticated USING (false) WITH CHECK (false);
