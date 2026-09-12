-- Adds admin activity log coverage for bulletin content: news post and announcement
-- create/update/delete now each write an AdminActivityLog row. See docs/features.md →
-- Admin activity log.
-- Master copy — the live copy of this SQL lives in the migration file of the same name.

-- AlterEnum
ALTER TYPE "AdminActivityAction" ADD VALUE 'news_post_created';
ALTER TYPE "AdminActivityAction" ADD VALUE 'news_post_updated';
ALTER TYPE "AdminActivityAction" ADD VALUE 'news_post_deleted';
ALTER TYPE "AdminActivityAction" ADD VALUE 'announcement_created';
ALTER TYPE "AdminActivityAction" ADD VALUE 'announcement_updated';
ALTER TYPE "AdminActivityAction" ADD VALUE 'announcement_deleted';

-- AlterEnum
ALTER TYPE "AdminActivityEntityType" ADD VALUE 'news_post';
ALTER TYPE "AdminActivityEntityType" ADD VALUE 'announcement';
