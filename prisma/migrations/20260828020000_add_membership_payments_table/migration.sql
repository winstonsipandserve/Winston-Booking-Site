-- Adds MembershipPayment: a dedicated model tracking PayMongo checkout attempts for
-- membership tier-activation payment, separate from the booking-scoped Payment table
-- (see CLAUDE.md → Architecture Decisions → Membership payment model).
-- Master copy at prisma/manual-sql/add-membership-payments-table.sql.

-- CreateTable
CREATE TABLE "membership_payments" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "tier" "MembershipTier" NOT NULL,
    "amount_centavos" INTEGER NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "paymongo_checkout_session_id" TEXT,
    "paymongo_payment_intent_id" TEXT,
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "membership_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "membership_payments_paymongo_checkout_session_id_key" ON "membership_payments"("paymongo_checkout_session_id");

-- CreateIndex
CREATE UNIQUE INDEX "membership_payments_paymongo_payment_intent_id_key" ON "membership_payments"("paymongo_payment_intent_id");

-- CreateIndex
CREATE INDEX "membership_payments_application_id_idx" ON "membership_payments"("application_id");

-- AddForeignKey
ALTER TABLE "membership_payments" ADD CONSTRAINT "membership_payments_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "membership_applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RowLevelSecurity (Decision: Row Level Security — every new table enables RLS with deny-all policies in the same migration)
ALTER TABLE membership_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY deny_all_anon ON membership_payments FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY deny_all_authenticated ON membership_payments FOR ALL TO authenticated USING (false) WITH CHECK (false);
