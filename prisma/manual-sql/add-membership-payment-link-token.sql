-- Adds MembershipPaymentLinkToken: gates /membership/pay/[id] and POST
-- /api/membership-payments with a bounded-lifetime, hashed capability token instead of the
-- bare application id, mirroring MemberActivationToken's shape (see CLAUDE.md).
-- Master copy — the live copy of this SQL lives in the migration file of the same name.

-- CreateTable
CREATE TABLE "membership_payment_link_tokens" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "membership_payment_link_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "membership_payment_link_tokens_token_hash_key" ON "membership_payment_link_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "membership_payment_link_tokens_application_id_idx" ON "membership_payment_link_tokens"("application_id");

-- AddForeignKey
ALTER TABLE "membership_payment_link_tokens" ADD CONSTRAINT "membership_payment_link_tokens_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "membership_applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RowLevelSecurity (Decision: Row Level Security — every new table enables RLS with deny-all policies in the same migration)
ALTER TABLE membership_payment_link_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY deny_all_anon ON membership_payment_link_tokens FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY deny_all_authenticated ON membership_payment_link_tokens FOR ALL TO authenticated USING (false) WITH CHECK (false);
