-- Adds CheckInLookupAttempt: a per-admin soft abuse-detection counter for
-- /admin/check-in's Enter Code lookup (6-digit code space is brute-forceable).
-- Not a financial/audit ledger, so no locking/transaction guarantee is required
-- (see CLAUDE.md → Architecture Decisions → Member check-in (QR + fallback code)).
-- Master copy at prisma/manual-sql/check-in-lookup-attempt-table.sql.

-- CreateTable
CREATE TABLE "check_in_lookup_attempts" (
    "id" TEXT NOT NULL,
    "admin_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "check_in_lookup_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "check_in_lookup_attempts_admin_user_id_created_at_idx" ON "check_in_lookup_attempts"("admin_user_id", "created_at");

-- AddForeignKey
ALTER TABLE "check_in_lookup_attempts" ADD CONSTRAINT "check_in_lookup_attempts_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RowLevelSecurity (Decision: Row Level Security — every new table enables RLS with deny-all policies in the same migration)
ALTER TABLE check_in_lookup_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY deny_all_anon ON check_in_lookup_attempts FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY deny_all_authenticated ON check_in_lookup_attempts FOR ALL TO authenticated USING (false) WITH CHECK (false);
