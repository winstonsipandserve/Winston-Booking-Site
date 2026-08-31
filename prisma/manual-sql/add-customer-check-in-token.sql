-- Adds a stable per-customer check-in token used to render the member-portal QR code
-- (see CLAUDE.md → Architecture Decisions → Customer & auth model, "Member QR code").
-- Null until first generated on /account load via getOrCreateCheckInToken.
-- Master copy — the live copy of this SQL lives in the migration file of the same name.

-- AlterTable
ALTER TABLE "customers" ADD COLUMN "check_in_token" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "customers_check_in_token_key" ON "customers"("check_in_token");
