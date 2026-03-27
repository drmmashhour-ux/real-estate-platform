-- CreateEnum
CREATE TYPE "BrokerPayoutStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "broker_payouts" (
    "id" TEXT NOT NULL,
    "broker_id" TEXT NOT NULL,
    "status" "BrokerPayoutStatus" NOT NULL DEFAULT 'PENDING',
    "payout_method" TEXT NOT NULL DEFAULT 'manual',
    "total_amount_cents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'cad',
    "approved_at" TIMESTAMP(3),
    "approved_by_user_id" TEXT,
    "paid_at" TIMESTAMP(3),
    "recorded_paid_by_user_id" TEXT,
    "failure_reason" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "broker_payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "broker_payout_lines" (
    "id" TEXT NOT NULL,
    "payout_id" TEXT NOT NULL,
    "commission_id" TEXT NOT NULL,

    CONSTRAINT "broker_payout_lines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "broker_payout_lines_commission_id_key" ON "broker_payout_lines"("commission_id");

-- CreateIndex
CREATE INDEX "broker_payouts_broker_id_idx" ON "broker_payouts"("broker_id");

-- CreateIndex
CREATE INDEX "broker_payouts_status_idx" ON "broker_payouts"("status");

-- CreateIndex
CREATE INDEX "broker_payout_lines_payout_id_idx" ON "broker_payout_lines"("payout_id");

-- AddForeignKey
ALTER TABLE "broker_payouts" ADD CONSTRAINT "broker_payouts_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broker_payouts" ADD CONSTRAINT "broker_payouts_approved_by_user_id_fkey" FOREIGN KEY ("approved_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broker_payouts" ADD CONSTRAINT "broker_payouts_recorded_paid_by_user_id_fkey" FOREIGN KEY ("recorded_paid_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broker_payout_lines" ADD CONSTRAINT "broker_payout_lines_payout_id_fkey" FOREIGN KEY ("payout_id") REFERENCES "broker_payouts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broker_payout_lines" ADD CONSTRAINT "broker_payout_lines_commission_id_fkey" FOREIGN KEY ("commission_id") REFERENCES "broker_commissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "tax_documents" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active',
ADD COLUMN     "issue_date" TIMESTAMP(3);

CREATE INDEX "tax_documents_status_idx" ON "tax_documents"("status");

-- PlatformPayment: track last change (webhook updates)
ALTER TABLE "platform_payments" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
