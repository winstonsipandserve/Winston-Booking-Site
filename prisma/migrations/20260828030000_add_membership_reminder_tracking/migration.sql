-- Adds reminder/expiry-email tracking columns to memberships, so the new membership-reminders
-- cron can never send the same 14-day/3-day/expired email twice to the same row (see CLAUDE.md
-- Architecture Decisions and PROGRESS.md membership-reminders entry).
-- Master copy — the live copy of this SQL lives in the migration file of the same name;
-- mirrored at prisma/manual-sql/membership-reminder-tracking.sql per project convention.

-- AlterTable
ALTER TABLE "memberships" ADD COLUMN "reminder_14_sent_at" TIMESTAMP(3);
ALTER TABLE "memberships" ADD COLUMN "reminder_3_sent_at" TIMESTAMP(3);
ALTER TABLE "memberships" ADD COLUMN "expired_notice_sent_at" TIMESTAMP(3);

-- Backfill: mark each pre-existing membership as already having "received" whichever of these
-- emails its end_date would already have triggered, so this feature's first cron run doesn't
-- blast every already-expiring/expired membership with a reminder it "missed" pre-feature.
-- Deliberately NOT a blanket backfill — a membership not yet within any threshold is left
-- with all three columns NULL, so it still receives its reminders/notice on schedule later.
UPDATE "memberships" SET "reminder_14_sent_at" = "end_date" WHERE "end_date" <= NOW() + INTERVAL '14 days';
UPDATE "memberships" SET "reminder_3_sent_at" = "end_date" WHERE "end_date" <= NOW() + INTERVAL '3 days';
UPDATE "memberships" SET "expired_notice_sent_at" = "end_date" WHERE "end_date" <= NOW();
