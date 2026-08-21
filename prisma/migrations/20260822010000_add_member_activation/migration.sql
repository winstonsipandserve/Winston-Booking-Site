-- AlterTable
ALTER TABLE "customers" ADD COLUMN "password_hash" TEXT;

-- CreateTable
CREATE TABLE "member_activation_tokens" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "member_activation_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "member_activation_tokens_token_hash_key" ON "member_activation_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "member_activation_tokens_customer_id_idx" ON "member_activation_tokens"("customer_id");

-- AddForeignKey
ALTER TABLE "member_activation_tokens" ADD CONSTRAINT "member_activation_tokens_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RowLevelSecurity (Decision: Row Level Security — every new table enables RLS with deny-all policies in the same migration)
ALTER TABLE member_activation_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY deny_all_anon ON member_activation_tokens FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY deny_all_authenticated ON member_activation_tokens FOR ALL TO authenticated USING (false) WITH CHECK (false);
