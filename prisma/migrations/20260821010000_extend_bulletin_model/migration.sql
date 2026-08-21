-- CreateEnum
CREATE TYPE "BulletinCategory" AS ENUM ('Renovation', 'Closure', 'Tournament', 'Community');

-- AlterTable
ALTER TABLE "bulletins"
  ADD COLUMN "excerpt" TEXT NOT NULL,
  ADD COLUMN "category" "BulletinCategory" NOT NULL,
  ADD COLUMN "image_url" TEXT NOT NULL,
  ADD COLUMN "social_platform" TEXT,
  ADD COLUMN "social_url" TEXT;
