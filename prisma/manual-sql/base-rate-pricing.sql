-- Tier booking discount for the September 2026 client update (docs/business.md → Pricing →
-- Member discount; docs/decisions.md → "Member pricing is a tier percentage off the base
-- rate, not separate rows").
--
-- pricing_rules becomes one BASE rate per resource type and duration: the stopgap `member`
-- rows are deleted and the rate_tier column dropped. Coaching (add_on_pricing_rules) keeps
-- its member / non-member rows. Bookings gain a snapshot of the discount actually applied.
-- Existing bookings are sample data and get 0.

DELETE FROM "pricing_rules" WHERE "rate_tier" = 'member';

DROP INDEX "pricing_rules_resource_type_id_rate_tier_duration_minutes_key";
ALTER TABLE "pricing_rules" DROP COLUMN "rate_tier";
CREATE UNIQUE INDEX "pricing_rules_resource_type_id_duration_minutes_key"
  ON "pricing_rules" ("resource_type_id", "duration_minutes");

ALTER TABLE "bookings"
  ADD COLUMN "member_discount_centavos" INTEGER NOT NULL DEFAULT 0;
