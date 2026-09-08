-- Promotion-category display fields on Bulletin, additive and all nullable at the DB
-- level (required-ness enforced at the app layer for the Promotion category only — see
-- CLAUDE.md's Bulletin / Promotion category decision and src/lib/bulletin-validation.ts).
-- Display only: promoCode/discountSummary are never validated or redeemed against a real
-- price — the discount itself is applied manually by an admin via PricingRule.
-- No RLS statement needed here — new columns on an existing table (`bulletins` already
-- has RLS deny-all from a prior migration).

CREATE TYPE "BulletinCustomerEligibility" AS ENUM ('Everyone', 'MembersOnly', 'NewCustomers', 'ReturningCustomers', 'SpecificMembershipTier');

ALTER TABLE "bulletins" ADD COLUMN "promo_code" TEXT;
ALTER TABLE "bulletins" ADD COLUMN "discount_summary" TEXT;
ALTER TABLE "bulletins" ADD COLUMN "customer_eligibility" "BulletinCustomerEligibility";
