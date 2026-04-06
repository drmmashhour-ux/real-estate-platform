-- Supporting indexes for dedupe lookups and launch-scan style queries (additive, safe if rerun).

CREATE INDEX IF NOT EXISTS "bnhub_leads_campaign_external_ref_idx"
  ON "bnhub_leads" ("campaign_id", "external_lead_ref")
  WHERE "external_lead_ref" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "bnhub_leads_listing_email_created_idx"
  ON "bnhub_leads" ("listing_id", "email", "created_at" DESC)
  WHERE "listing_id" IS NOT NULL AND "email" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "bnhub_growth_recommendations_listing_launch_open_idx"
  ON "bnhub_growth_recommendations" ("listing_id", "recommendation_type", "status")
  WHERE "status" = 'OPEN' AND "listing_id" IS NOT NULL;
