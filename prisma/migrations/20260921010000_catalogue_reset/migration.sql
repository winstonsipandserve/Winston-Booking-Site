-- Catalogue reset for the September 2026 client update (docs/business.md → Sports,
-- Resources & Facilities / Pricing / Guest Fee / Add-On Services; docs/decisions.md →
-- "Tennis court and ball boy are removed, not disabled").
--
-- Removes the tennis court resource type, the ball boy add-on, the retired simulator
-- duration tiers (15 min everywhere; 30 and 90 min golf), the surplus units (pickleball
-- Court 3, pickleball Bay 2, golf Bay 2), and sets the guest fee to ₱100.
--
-- The site is unpublished: every booking in every environment is sample data, so this
-- migration also deletes the sample bookings on the removed units (and their payment,
-- credit-ledger, add-on, and reschedule rows) plus any ball-boy add-on rows on bookings
-- that stay. New prices and the second tennis simulator bay come from `npm run db:seed`,
-- not from here.

-- 0. Sample bookings on the units being removed, dependants first.
CREATE TEMP TABLE "removed_resources" AS
SELECT r."id"
FROM "resources" r
JOIN "resource_types" rt ON rt."id" = r."resource_type_id"
WHERE rt."slug" = 'tennis_court'
   OR (rt."slug" = 'pickleball_court' AND r."label" = 'Court 3')
   OR (rt."slug" IN ('pickleball_sim', 'golf_sim') AND r."label" = 'Bay 2');

CREATE TEMP TABLE "removed_bookings" AS
SELECT "id" FROM "bookings" WHERE "resource_id" IN (SELECT "id" FROM "removed_resources");

DELETE FROM "membership_credit_transactions" WHERE "booking_id" IN (SELECT "id" FROM "removed_bookings");
DELETE FROM "payments" WHERE "booking_id" IN (SELECT "id" FROM "removed_bookings");
DELETE FROM "booking_add_ons" WHERE "booking_id" IN (SELECT "id" FROM "removed_bookings");
DELETE FROM "booking_reschedules" WHERE "booking_id" IN (SELECT "id" FROM "removed_bookings");
DELETE FROM "bookings" WHERE "id" IN (SELECT "id" FROM "removed_bookings");

-- 1. Ball boy add-on: booking rows, then pricing rules, then the service.
DELETE FROM "booking_add_ons"
WHERE "add_on_service_id" IN (SELECT "id" FROM "add_on_services" WHERE "slug" = 'ball_boy');

DELETE FROM "add_on_pricing_rules"
WHERE "add_on_service_id" IN (SELECT "id" FROM "add_on_services" WHERE "slug" = 'ball_boy');

DELETE FROM "add_on_services" WHERE "slug" = 'ball_boy';

-- 2. Tennis court rates (court rate rows and coaching rows).
DELETE FROM "add_on_pricing_rules"
WHERE "resource_type_id" IN (SELECT "id" FROM "resource_types" WHERE "slug" = 'tennis_court');

DELETE FROM "pricing_rules"
WHERE "resource_type_id" IN (SELECT "id" FROM "resource_types" WHERE "slug" = 'tennis_court');

-- 3. Retired duration tiers on the remaining simulators.
DELETE FROM "pricing_rules" WHERE "duration_minutes" = 15;

DELETE FROM "pricing_rules"
WHERE "duration_minutes" IN (30, 90)
  AND "resource_type_id" IN (SELECT "id" FROM "resource_types" WHERE "slug" = 'golf_sim');

-- 4. Retired units. announcement_resources / bulletin_resources cascade.
DELETE FROM "resources" WHERE "id" IN (SELECT "id" FROM "removed_resources");

-- 5. The tennis court type itself.
DELETE FROM "resource_types" WHERE "slug" = 'tennis_court';

-- 6. Recreate both enums without the dropped values. Postgres cannot DROP a single enum
--    value, so rename → create → retype the column → drop the old type.
ALTER TYPE "ResourceTypeSlug" RENAME TO "ResourceTypeSlug_old";
CREATE TYPE "ResourceTypeSlug" AS ENUM ('pickleball_court', 'tennis_sim', 'pickleball_sim', 'golf_sim');
ALTER TABLE "resource_types"
  ALTER COLUMN "slug" TYPE "ResourceTypeSlug" USING ("slug"::text::"ResourceTypeSlug");
DROP TYPE "ResourceTypeSlug_old";

ALTER TYPE "AddOnServiceSlug" RENAME TO "AddOnServiceSlug_old";
CREATE TYPE "AddOnServiceSlug" AS ENUM ('coaching_fee');
ALTER TABLE "add_on_services"
  ALTER COLUMN "slug" TYPE "AddOnServiceSlug" USING ("slug"::text::"AddOnServiceSlug");
DROP TYPE "AddOnServiceSlug_old";

-- 7. Guest fee is now ₱100 per additional guest.
UPDATE "guest_fee_rules" SET "amount_centavos" = 10000;

DROP TABLE "removed_bookings";
DROP TABLE "removed_resources";
