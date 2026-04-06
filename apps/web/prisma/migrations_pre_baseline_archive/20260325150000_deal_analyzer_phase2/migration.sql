-- Deal Analyzer Phase 2: comparables, nullable FSBO link, BNHub analysis link, scenario extensions

ALTER TABLE "deal_analyses" DROP CONSTRAINT IF EXISTS "deal_analyses_property_id_fkey";

ALTER TABLE "deal_analyses" ALTER COLUMN "property_id" DROP NOT NULL;

ALTER TABLE "deal_analyses" ADD CONSTRAINT "deal_analyses_property_id_fkey"
  FOREIGN KEY ("property_id") REFERENCES "fsbo_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "deal_analyses" ADD COLUMN IF NOT EXISTS "short_term_listing_id" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "deal_analyses_short_term_listing_id_key" ON "deal_analyses"("short_term_listing_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'deal_analyses_short_term_listing_id_fkey'
  ) THEN
    ALTER TABLE "deal_analyses" ADD CONSTRAINT "deal_analyses_short_term_listing_id_fkey"
      FOREIGN KEY ("short_term_listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "idx_deal_analyses_short_term_listing_id" ON "deal_analyses"("short_term_listing_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'deal_analyses_one_entity_ck'
  ) THEN
    ALTER TABLE "deal_analyses" ADD CONSTRAINT "deal_analyses_one_entity_ck"
      CHECK ("property_id" IS NOT NULL OR "short_term_listing_id" IS NOT NULL);
  END IF;
END $$;

ALTER TABLE "deal_analysis_scenarios" ADD COLUMN IF NOT EXISTS "scenario_mode" TEXT;
ALTER TABLE "deal_analysis_scenarios" ADD COLUMN IF NOT EXISTS "details" JSONB;

CREATE TABLE IF NOT EXISTS "deal_analysis_comparables" (
    "id" TEXT NOT NULL,
    "analysis_id" TEXT NOT NULL,
    "comparable_property_id" TEXT NOT NULL,
    "distance_km" DOUBLE PRECISION,
    "similarity_score" DOUBLE PRECISION NOT NULL,
    "source_type" TEXT NOT NULL,
    "price_cents" INTEGER NOT NULL,
    "price_per_sqft" DOUBLE PRECISION,
    "property_type" TEXT,
    "bedrooms" INTEGER,
    "bathrooms" DOUBLE PRECISION,
    "area_sqft" INTEGER,
    "listing_status" TEXT,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deal_analysis_comparables_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_deal_analysis_comparables_analysis_id" ON "deal_analysis_comparables"("analysis_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'deal_analysis_comparables_analysis_id_fkey'
  ) THEN
    ALTER TABLE "deal_analysis_comparables" ADD CONSTRAINT "deal_analysis_comparables_analysis_id_fkey"
      FOREIGN KEY ("analysis_id") REFERENCES "deal_analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
