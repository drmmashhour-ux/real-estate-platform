-- CreateEnum
CREATE TYPE "BrokerTaxRegistrationStatus" AS ENUM ('SUBMITTED', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "broker_tax_registrations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "legal_name" TEXT NOT NULL,
    "business_name" TEXT,
    "business_number_nine" TEXT NOT NULL,
    "gst_number" TEXT,
    "qst_number" TEXT,
    "business_address" TEXT NOT NULL,
    "province" TEXT NOT NULL DEFAULT 'QC',
    "status" "BrokerTaxRegistrationStatus" NOT NULL DEFAULT 'SUBMITTED',
    "admin_notes" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "broker_tax_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "broker_tax_registrations_user_id_key" ON "broker_tax_registrations"("user_id");

-- CreateIndex
CREATE INDEX "broker_tax_registrations_status_idx" ON "broker_tax_registrations"("status");

-- CreateIndex
CREATE INDEX "broker_tax_registrations_province_idx" ON "broker_tax_registrations"("province");

-- AddForeignKey
ALTER TABLE "broker_tax_registrations" ADD CONSTRAINT "broker_tax_registrations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broker_tax_registrations" ADD CONSTRAINT "broker_tax_registrations_reviewed_by_user_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "platform_payments" ADD COLUMN IF NOT EXISTS "broker_tax_snapshot" JSONB;

-- AlterTable
ALTER TABLE "platform_invoices" ADD COLUMN IF NOT EXISTS "invoice_tax_details" JSONB;
