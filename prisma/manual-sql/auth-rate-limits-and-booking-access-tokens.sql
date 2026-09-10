-- Opaque, hashed browser capabilities for the anonymous booking flow, plus a short-lived
-- rate-limit counter for credential and reset-email abuse. Master copy; keep synchronized
-- with prisma/migrations/20260910090000_add_auth_rate_limits_and_booking_access_tokens/migration.sql.

ALTER TABLE "bookings"
ADD COLUMN "access_token_hash" TEXT,
ADD COLUMN "access_token_expires_at" TIMESTAMP(3);

CREATE TYPE "AuthRateLimitScope" AS ENUM (
  'admin_login',
  'member_login',
  'admin_password_reset',
  'member_password_reset'
);

CREATE TABLE "auth_rate_limit_attempts" (
  "id" TEXT NOT NULL,
  "scope" "AuthRateLimitScope" NOT NULL,
  "identifier_hash" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "auth_rate_limit_attempts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "auth_rate_limit_attempts_scope_identifier_hash_created_at_idx"
ON "auth_rate_limit_attempts"("scope", "identifier_hash", "created_at");

CREATE INDEX "auth_rate_limit_attempts_created_at_idx"
ON "auth_rate_limit_attempts"("created_at");

ALTER TABLE auth_rate_limit_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY deny_all_anon ON auth_rate_limit_attempts FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY deny_all_authenticated ON auth_rate_limit_attempts FOR ALL TO authenticated USING (false) WITH CHECK (false);
