-- Deferred FK: growth_engine_leads (20260406180000) references listing_acquisition_leads,
-- which is created in 20260416120000_listing_acquisition_supply — must run after that migration.

DO $$ BEGIN
  ALTER TABLE "growth_engine_leads" ADD CONSTRAINT "growth_engine_leads_listing_acquisition_lead_id_fkey" FOREIGN KEY ("listing_acquisition_lead_id") REFERENCES "listing_acquisition_leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
