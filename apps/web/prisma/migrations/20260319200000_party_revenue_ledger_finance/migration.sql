-- Party vs platform revenue ledger (separate from Revenue Intelligence `RevenueLedgerEntry`)
CREATE TYPE "RevenueParty" AS ENUM ('PLATFORM', 'BROKER');

CREATE TABLE "platform_financial_settings" (
    "id" TEXT NOT NULL,
    "legal_name" TEXT,
    "platform_gst_number" TEXT,
    "platform_qst_number" TEXT,
    "default_gst_rate" DECIMAL(12,8) NOT NULL DEFAULT 0.05,
    "default_qst_rate" DECIMAL(12,8) NOT NULL DEFAULT 0.09975,
    "apply_tax_platform_services" BOOLEAN NOT NULL DEFAULT true,
    "apply_tax_broker_commissions" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_financial_settings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "party_revenue_ledger_entries" (
    "id" TEXT NOT NULL,
    "platform_payment_id" TEXT NOT NULL,
    "party" "RevenueParty" NOT NULL,
    "category" TEXT NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'cad',
    "broker_commission_id" TEXT,
    "broker_id" TEXT,
    "deal_id" TEXT,
    "listing_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "party_revenue_ledger_entries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "party_revenue_ledger_entries_broker_commission_id_key" ON "party_revenue_ledger_entries"("broker_commission_id");

CREATE INDEX "party_revenue_ledger_entries_platform_payment_id_idx" ON "party_revenue_ledger_entries"("platform_payment_id");
CREATE INDEX "party_revenue_ledger_entries_party_idx" ON "party_revenue_ledger_entries"("party");
CREATE INDEX "party_revenue_ledger_entries_broker_id_idx" ON "party_revenue_ledger_entries"("broker_id");
CREATE INDEX "party_revenue_ledger_entries_category_idx" ON "party_revenue_ledger_entries"("category");

ALTER TABLE "party_revenue_ledger_entries" ADD CONSTRAINT "party_revenue_ledger_entries_platform_payment_id_fkey" FOREIGN KEY ("platform_payment_id") REFERENCES "platform_payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "party_revenue_ledger_entries" ADD CONSTRAINT "party_revenue_ledger_entries_broker_commission_id_fkey" FOREIGN KEY ("broker_commission_id") REFERENCES "broker_commissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "party_revenue_ledger_entries" ADD CONSTRAINT "party_revenue_ledger_entries_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Platform payment tax audit fields
ALTER TABLE "platform_payments" ADD COLUMN IF NOT EXISTS "tax_calculation_json" JSONB;
ALTER TABLE "platform_payments" ADD COLUMN IF NOT EXISTS "tax_override_json" JSONB;

-- Invoice line tax breakdown
ALTER TABLE "platform_invoices" ADD COLUMN IF NOT EXISTS "subtotal_cents" INTEGER;
ALTER TABLE "platform_invoices" ADD COLUMN IF NOT EXISTS "gst_cents" INTEGER;
ALTER TABLE "platform_invoices" ADD COLUMN IF NOT EXISTS "qst_cents" INTEGER;
ALTER TABLE "platform_invoices" ADD COLUMN IF NOT EXISTS "total_cents" INTEGER;
ALTER TABLE "platform_invoices" ADD COLUMN IF NOT EXISTS "invoice_lines" JSONB;
ALTER TABLE "platform_invoices" ADD COLUMN IF NOT EXISTS "tax_mode" TEXT;

-- Extend broker tax registration workflow (format + staff review; not government verification)
-- Requires PostgreSQL 9.1+; each value added once per database.
ALTER TYPE "BrokerTaxRegistrationStatus" ADD VALUE 'FORMAT_VALID';
ALTER TYPE "BrokerTaxRegistrationStatus" ADD VALUE 'PENDING_STAFF_REVIEW';
ALTER TYPE "BrokerTaxRegistrationStatus" ADD VALUE 'MANUALLY_REVIEWED';

ALTER TABLE "broker_tax_registrations" ALTER COLUMN "status" SET DEFAULT 'PENDING_STAFF_REVIEW';
