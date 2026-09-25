-- Expand phase: introduce distinct operational announcements and editorial news
-- without dropping the legacy bulletin tables. Contract cleanup happens only after
-- every deployed application instance has moved to the new models.

CREATE TYPE "AnnouncementUrgency" AS ENUM ('info', 'warning', 'urgent');
CREATE TYPE "NewsCategory" AS ENUM ('tournament', 'community', 'promo', 'general');
CREATE TYPE "NewsStatus" AS ENUM ('draft', 'published');

CREATE TABLE "announcements" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "urgency" "AnnouncementUrgency" NOT NULL DEFAULT 'info',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "start_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_at" TIMESTAMP(3),
    "auto_disable_resources" BOOLEAN NOT NULL DEFAULT false,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "announcement_resources" (
    "id" TEXT NOT NULL,
    "announcement_id" TEXT NOT NULL,
    "resource_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcement_resources_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "news_posts" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body_html" TEXT NOT NULL,
    "cover_image_url" TEXT,
    "category" "NewsCategory" NOT NULL,
    "publish_at" TIMESTAMP(3),
    "status" "NewsStatus" NOT NULL DEFAULT 'draft',
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "news_posts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "announcements_is_active_start_at_end_at_idx"
    ON "announcements"("is_active", "start_at", "end_at");
CREATE INDEX "announcements_created_by_id_idx" ON "announcements"("created_by_id");
CREATE UNIQUE INDEX "announcement_resources_announcement_id_resource_id_key"
    ON "announcement_resources"("announcement_id", "resource_id");
CREATE INDEX "announcement_resources_resource_id_idx" ON "announcement_resources"("resource_id");
CREATE UNIQUE INDEX "news_posts_slug_key" ON "news_posts"("slug");
CREATE INDEX "news_posts_status_publish_at_idx" ON "news_posts"("status", "publish_at");
CREATE INDEX "news_posts_is_featured_publish_at_idx" ON "news_posts"("is_featured", "publish_at");
CREATE INDEX "news_posts_category_publish_at_idx" ON "news_posts"("category", "publish_at");
CREATE INDEX "news_posts_created_by_id_idx" ON "news_posts"("created_by_id");

ALTER TABLE "announcements"
    ADD CONSTRAINT "announcements_created_by_id_fkey"
    FOREIGN KEY ("created_by_id") REFERENCES "admin_users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "announcement_resources"
    ADD CONSTRAINT "announcement_resources_announcement_id_fkey"
    FOREIGN KEY ("announcement_id") REFERENCES "announcements"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "announcement_resources"
    ADD CONSTRAINT "announcement_resources_resource_id_fkey"
    FOREIGN KEY ("resource_id") REFERENCES "resources"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "news_posts"
    ADD CONSTRAINT "news_posts_created_by_id_fkey"
    FOREIGN KEY ("created_by_id") REFERENCES "admin_users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Existing operational categories become booking-entry announcements. Any
-- editorial item that held resources also receives a distinct operational copy.
INSERT INTO "announcements" (
    "id", "title", "message", "urgency", "is_active", "start_at", "end_at",
    "auto_disable_resources", "created_at", "updated_at"
)
SELECT
    CASE
      WHEN b."category" IN ('Renovation', 'Closure', 'FacilityMaintenance') THEN b."id"
      ELSE 'legacy-announcement-' || b."id"
    END,
    b."title",
    b."excerpt",
    CASE
      WHEN b."category" = 'Closure' THEN 'urgent'::"AnnouncementUrgency"
      WHEN b."category" IN ('Renovation', 'FacilityMaintenance') THEN 'warning'::"AnnouncementUrgency"
      ELSE 'info'::"AnnouncementUrgency"
    END,
    b."is_published",
    COALESCE(b."event_start_at", b."created_at"),
    COALESCE(b."expires_at", b."event_end_at"),
    b."auto_disable_resources",
    b."created_at",
    b."updated_at"
FROM "bulletins" b
WHERE b."title" NOT LIKE '[Sample]%'
  AND (
    b."category" IN ('Renovation', 'Closure', 'FacilityMaintenance')
    OR b."auto_disable_resources" = true
    OR EXISTS (
      SELECT 1 FROM "bulletin_resources" br WHERE br."bulletin_id" = b."id"
    )
  );

INSERT INTO "announcement_resources" (
    "id", "announcement_id", "resource_id", "created_at"
)
SELECT
    'legacy-announcement-resource-' || br."id",
    CASE
      WHEN b."category" IN ('Renovation', 'Closure', 'FacilityMaintenance') THEN b."id"
      ELSE 'legacy-announcement-' || b."id"
    END,
    br."resource_id",
    br."created_at"
FROM "bulletin_resources" br
JOIN "bulletins" b ON b."id" = br."bulletin_id"
WHERE b."title" NOT LIKE '[Sample]%';

-- Editorial categories become news. Legacy plain text is escaped before being
-- wrapped as HTML so migrated content cannot introduce markup.
INSERT INTO "news_posts" (
    "id", "slug", "title", "body_html", "cover_image_url", "category",
    "publish_at", "status", "is_featured", "created_at", "updated_at"
)
SELECT
    b."id",
    COALESCE(
      NULLIF(TRIM(BOTH '-' FROM LOWER(REGEXP_REPLACE(b."title", '[^a-zA-Z0-9]+', '-', 'g'))), ''),
      'news'
    ) || '-' || LEFT(b."id", 8),
    b."title",
    '<p>' || REPLACE(REPLACE(REPLACE(b."body", '&', '&amp;'), '<', '&lt;'), '>', '&gt;') || '</p>',
    b."image_url",
    CASE b."category"
      WHEN 'Tournament' THEN 'tournament'::"NewsCategory"
      WHEN 'Community' THEN 'community'::"NewsCategory"
      WHEN 'Promotion' THEN 'promo'::"NewsCategory"
      ELSE 'general'::"NewsCategory"
    END,
    b."published_at",
    CASE WHEN b."is_published" THEN 'published'::"NewsStatus" ELSE 'draft'::"NewsStatus" END,
    false,
    b."created_at",
    b."updated_at"
FROM "bulletins" b
WHERE b."title" NOT LIKE '[Sample]%'
  AND b."category" IN ('Tournament', 'Community', 'Promotion', 'General');

-- The development seed's seven samples are intentionally retired. This is
-- narrowly scoped so staff-created content is never deleted.
DELETE FROM "bulletin_resources"
WHERE "bulletin_id" IN (SELECT "id" FROM "bulletins" WHERE "title" LIKE '[Sample]%');
DELETE FROM "bulletins" WHERE "title" LIKE '[Sample]%';

ALTER TABLE "announcements" ENABLE ROW LEVEL SECURITY;
CREATE POLICY deny_all_anon ON "announcements" FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY deny_all_authenticated ON "announcements" FOR ALL TO authenticated USING (false) WITH CHECK (false);

ALTER TABLE "announcement_resources" ENABLE ROW LEVEL SECURITY;
CREATE POLICY deny_all_anon ON "announcement_resources" FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY deny_all_authenticated ON "announcement_resources" FOR ALL TO authenticated USING (false) WITH CHECK (false);

ALTER TABLE "news_posts" ENABLE ROW LEVEL SECURITY;
CREATE POLICY deny_all_anon ON "news_posts" FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY deny_all_authenticated ON "news_posts" FOR ALL TO authenticated USING (false) WITH CHECK (false);
