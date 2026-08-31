-- Remove the priority concept from Bulletin entirely (client/business decision —
-- announcements shouldn't carry a priority). Drops the column first, then the enum
-- type it depended on.

ALTER TABLE "bulletins"
  DROP COLUMN "priority";

DROP TYPE IF EXISTS "BulletinPriority";
