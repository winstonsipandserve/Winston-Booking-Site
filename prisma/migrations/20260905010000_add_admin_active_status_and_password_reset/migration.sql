-- Adds AdminUser.isActive (default true — deactivation blocks login and every existing
-- session's next request/API call via getActiveAdminSession(), not just next login) and
-- AdminPasswordResetToken (mirrors PasswordResetToken's shape exactly, FK'd to AdminUser
-- ON DELETE CASCADE) for admin self-service forgot/reset password. See CLAUDE.md.
-- Master copy at prisma/manual-sql/add-admin-active-status-and-password-reset.sql.

-- AlterTable
ALTER TABLE "admin_users" ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "admin_password_reset_tokens" (
    "id" TEXT NOT NULL,
    "admin_user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_password_reset_tokens_token_hash_key" ON "admin_password_reset_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "admin_password_reset_tokens_admin_user_id_idx" ON "admin_password_reset_tokens"("admin_user_id");

-- AddForeignKey
ALTER TABLE "admin_password_reset_tokens" ADD CONSTRAINT "admin_password_reset_tokens_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RowLevelSecurity (Decision: Row Level Security — every new table enables RLS with deny-all policies in the same migration)
ALTER TABLE admin_password_reset_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY deny_all_anon ON admin_password_reset_tokens FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY deny_all_authenticated ON admin_password_reset_tokens FOR ALL TO authenticated USING (false) WITH CHECK (false);
