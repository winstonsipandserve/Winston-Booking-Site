-- Adds two BulletinCategory values (General, FacilityMaintenance) and a set of
-- optional metadata fields to Bulletin, plus a new BulletinPriority enum.
-- Split into two statements/migrations: ALTER TYPE ... ADD VALUE must not be
-- combined with other DDL that could reference the new value in the same
-- transaction on some Postgres versions, so it runs as its own migration
-- (20260827040000_add_bulletin_category_values) ahead of the column-add
-- migration (20260827050000_add_bulletin_metadata_columns) which contains the
-- rest of this file's statements.

-- Migration 1: 20260827040000_add_bulletin_category_values
ALTER TYPE "BulletinCategory" ADD VALUE 'General';
ALTER TYPE "BulletinCategory" ADD VALUE 'FacilityMaintenance';

-- Migration 2: 20260827050000_add_bulletin_metadata_columns
CREATE TYPE "BulletinPriority" AS ENUM ('Normal', 'High');

ALTER TABLE "bulletins"
  ADD COLUMN "priority" "BulletinPriority" NOT NULL DEFAULT 'Normal',
  ADD COLUMN "affected_facility" TEXT,
  ADD COLUMN "impact" TEXT,
  ADD COLUMN "action" TEXT,
  ADD COLUMN "event_start_at" TIMESTAMP(3),
  ADD COLUMN "event_end_at" TIMESTAMP(3),
  ADD COLUMN "expires_at" TIMESTAMP(3),
  ADD COLUMN "cta_label" TEXT,
  ADD COLUMN "cta_url" TEXT;
