-- CreateEnum
CREATE TYPE "BulletinPriority" AS ENUM ('Normal', 'High');

-- AlterTable
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
