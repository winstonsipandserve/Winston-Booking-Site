-- Master copy of prisma/migrations/20260914030000_add_password_changed_at.
-- Session revocation on password change: a JWT issued before this instant is rejected.
ALTER TABLE "customers" ADD COLUMN "password_changed_at" TIMESTAMP(3);
ALTER TABLE "admin_users" ADD COLUMN "password_changed_at" TIMESTAMP(3);
