-- Separate the advance-notice date from the operational window. A NULL announce_at
-- keeps today's behavior (visible from start_at), so existing rows are unaffected.
ALTER TABLE "announcements" ADD COLUMN "announce_at" TIMESTAMP(3);

CREATE INDEX "announcements_is_active_announce_at_end_at_idx"
    ON "announcements"("is_active", "announce_at", "end_at");
