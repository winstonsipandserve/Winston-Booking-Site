-- Membership product reset for the September 2026 client update (docs/business.md →
-- Membership; docs/decisions.md → "Founding Member is a flag, not a tier").
--
-- Replaces the 3 / 6 / 12-month plans with Winston Player / Premier / Elite, drops the
-- activation-fee / credit split (no credit is granted with a membership any more), adds the
-- Founding Member flag to memberships and membership payments, and removes two pieces of
-- dead schema: the never-read memberships.status column and the activation / renewal
-- credit-ledger reasons that can no longer be written.
--
-- The site is unpublished: every membership record in every environment is sample data, so
-- this migration deletes it all first (old tier values cannot be cast into the new enum).
-- Customers, admins, bookings, and content stay.

-- 1. Sample membership data, dependants first. Activity-log rows about these entities go
--    too, since their loose entity ids would otherwise point at nothing.
DELETE FROM "membership_credit_transactions";
DELETE FROM "payments" WHERE "membership_id" IS NOT NULL;
DELETE FROM "memberships";
DELETE FROM "membership_payment_link_tokens";
DELETE FROM "membership_payments";
DELETE FROM "membership_applications";
DELETE FROM "admin_activity_logs" WHERE "entity_type" IN ('membership_application', 'membership');

-- 2. memberships: drop the dead status column and the activation fee; add the Founding flag;
--    credit now starts at zero.
ALTER TABLE "memberships"
  DROP COLUMN "status",
  DROP COLUMN "activation_fee_centavos",
  ADD COLUMN "is_founding" BOOLEAN NOT NULL DEFAULT false,
  ALTER COLUMN "credit_balance_centavos" SET DEFAULT 0;

DROP TYPE "MembershipStatus";

-- 3. membership_payments: the Founding flag, decided when the row is priced.
ALTER TABLE "membership_payments"
  ADD COLUMN "is_founding" BOOLEAN NOT NULL DEFAULT false;

-- 4. Recreate MembershipTier with the new plans (rename → create → retype → drop old).
ALTER TYPE "MembershipTier" RENAME TO "MembershipTier_old";
CREATE TYPE "MembershipTier" AS ENUM ('player', 'premier', 'elite');
ALTER TABLE "memberships"
  ALTER COLUMN "tier" TYPE "MembershipTier" USING ("tier"::text::"MembershipTier");
ALTER TABLE "membership_payments"
  ALTER COLUMN "tier" TYPE "MembershipTier" USING ("tier"::text::"MembershipTier");
ALTER TABLE "membership_applications"
  ALTER COLUMN "requested_tier" TYPE "MembershipTier" USING ("requested_tier"::text::"MembershipTier");
DROP TYPE "MembershipTier_old";

-- 5. Recreate CreditTransactionReason without activation / renewal.
ALTER TYPE "CreditTransactionReason" RENAME TO "CreditTransactionReason_old";
CREATE TYPE "CreditTransactionReason" AS ENUM ('booking_redemption', 'top_up');
ALTER TABLE "membership_credit_transactions"
  ALTER COLUMN "reason" TYPE "CreditTransactionReason" USING ("reason"::text::"CreditTransactionReason");
DROP TYPE "CreditTransactionReason_old";
