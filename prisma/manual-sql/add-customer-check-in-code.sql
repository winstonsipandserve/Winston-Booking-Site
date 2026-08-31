-- Adds a 6-digit fallback check-in code paired with the existing check_in_token,
-- for admin manual entry when scanning a member's QR code isn't practical.
-- Zero-padded VARCHAR(6) so leading zeros survive (e.g. "042917").
-- Always created/rotated together with check_in_token — see check-in-token.ts.
-- Master copy — the live copy of this SQL lives in the migration file of the same name.

-- AlterTable
ALTER TABLE "customers" ADD COLUMN "check_in_code" VARCHAR(6);

-- CreateIndex
CREATE UNIQUE INDEX "customers_check_in_code_key" ON "customers"("check_in_code");
