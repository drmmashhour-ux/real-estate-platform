-- Free listing intake: F- reference code, ID URL, extra documents JSON.
ALTER TABLE "listing_acquisition_leads" ADD COLUMN IF NOT EXISTS "intake_code" TEXT;
ALTER TABLE "listing_acquisition_leads" ADD COLUMN IF NOT EXISTS "identity_document_url" TEXT;
ALTER TABLE "listing_acquisition_leads" ADD COLUMN IF NOT EXISTS "submitted_document_urls" JSONB NOT NULL DEFAULT '[]';

CREATE UNIQUE INDEX IF NOT EXISTS "listing_acquisition_leads_intake_code_key" ON "listing_acquisition_leads"("intake_code");
