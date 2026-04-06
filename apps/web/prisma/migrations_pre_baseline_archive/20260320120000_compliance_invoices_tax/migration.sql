-- Split invoice issuer (platform vs broker); per-type tax overrides; investment feature flag
CREATE TYPE "InvoiceIssuer" AS ENUM ('PLATFORM', 'BROKER');

ALTER TABLE "platform_financial_settings" ADD COLUMN IF NOT EXISTS "payment_type_tax_overrides" JSONB;
ALTER TABLE "platform_financial_settings" ADD COLUMN IF NOT EXISTS "investment_features_enabled" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "platform_invoices" ADD COLUMN IF NOT EXISTS "invoice_issuer" "InvoiceIssuer" NOT NULL DEFAULT 'PLATFORM';
ALTER TABLE "platform_invoices" ADD COLUMN IF NOT EXISTS "invoice_label" TEXT;

-- Legacy rows: single invoice per payment assumed PLATFORM issuer
CREATE UNIQUE INDEX IF NOT EXISTS "platform_invoices_payment_id_invoice_issuer_key" ON "platform_invoices"("payment_id", "invoice_issuer");
CREATE INDEX IF NOT EXISTS "platform_invoices_invoice_issuer_idx" ON "platform_invoices"("invoice_issuer");
