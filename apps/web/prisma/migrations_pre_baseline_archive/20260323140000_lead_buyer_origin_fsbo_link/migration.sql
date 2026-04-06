-- LeadContactOrigin: BUYER
DO $$ BEGIN
  ALTER TYPE "LeadContactOrigin" ADD VALUE 'BUYER';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Link CRM Lead to FSBO listing for Buyer Hub inquiries
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "fsbo_listing_id" TEXT;

CREATE INDEX IF NOT EXISTS "Lead_fsbo_listing_id_idx" ON "Lead"("fsbo_listing_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Lead_fsbo_listing_id_fkey'
  ) THEN
    ALTER TABLE "Lead"
      ADD CONSTRAINT "Lead_fsbo_listing_id_fkey"
      FOREIGN KEY ("fsbo_listing_id") REFERENCES "fsbo_listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
