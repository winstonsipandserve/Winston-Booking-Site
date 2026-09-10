-- Rename the existing free-text manual-disable note column out of the way so the new
-- structured `disabled_reason` enum column below can take its name. Data-preserving rename,
-- not a drop+recreate — existing admin-entered notes (e.g. "Under renovation") survive.
ALTER TABLE "resources" RENAME COLUMN "disabled_reason" TO "disabled_note";

-- New enum type + column: tracks which mechanism most recently disabled a resource.
CREATE TYPE "ResourceDisabledReason" AS ENUM ('manual', 'bulletin');
ALTER TABLE "resources" ADD COLUMN "disabled_reason" "ResourceDisabledReason";

-- Backfill: every currently-disabled resource was disabled manually (bulletin-triggered
-- disabling doesn't exist before this migration), so attribute existing inactive rows to 'manual'.
UPDATE "resources" SET "disabled_reason" = 'manual' WHERE "is_active" = false;

-- Bulletin: admin toggle to auto-disable linked resources while published.
ALTER TABLE "bulletins" ADD COLUMN "auto_disable_resources" BOOLEAN NOT NULL DEFAULT false;

-- New join table: which resources a bulletin is linked to.
CREATE TABLE "bulletin_resources" (
    "id" TEXT NOT NULL,
    "bulletin_id" TEXT NOT NULL,
    "resource_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bulletin_resources_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "bulletin_resources_bulletin_id_resource_id_key" ON "bulletin_resources"("bulletin_id", "resource_id");
CREATE INDEX "bulletin_resources_resource_id_idx" ON "bulletin_resources"("resource_id");

ALTER TABLE "bulletin_resources" ADD CONSTRAINT "bulletin_resources_bulletin_id_fkey" FOREIGN KEY ("bulletin_id") REFERENCES "bulletins"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bulletin_resources" ADD CONSTRAINT "bulletin_resources_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RLS: deny-all for anon/authenticated (see prisma/manual-sql/enable-rls-deny-all.sql, the
-- master copy this block is also appended to).
ALTER TABLE "bulletin_resources" ENABLE ROW LEVEL SECURITY;
CREATE POLICY deny_all_anon ON "bulletin_resources" FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY deny_all_authenticated ON "bulletin_resources" FOR ALL TO authenticated USING (false) WITH CHECK (false);
