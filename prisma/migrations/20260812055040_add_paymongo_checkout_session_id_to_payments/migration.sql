-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "paymongo_checkout_session_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "payments_paymongo_checkout_session_id_key" ON "payments"("paymongo_checkout_session_id");
