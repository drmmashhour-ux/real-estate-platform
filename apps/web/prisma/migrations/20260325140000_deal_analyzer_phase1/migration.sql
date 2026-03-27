-- AI Deal Analyzer Phase 1 — deterministic scores (FSBO listing id stored as property_id)

CREATE TABLE IF NOT EXISTS "deal_analyses" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "analysis_type" TEXT NOT NULL,
    "investment_score" INTEGER NOT NULL,
    "risk_score" INTEGER NOT NULL,
    "confidence_score" INTEGER,
    "recommendation" TEXT NOT NULL,
    "opportunity_type" TEXT NOT NULL,
    "summary" JSONB,
    "explanation" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deal_analyses_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_deal_analyses_property_id" ON "deal_analyses"("property_id");
CREATE INDEX IF NOT EXISTS "idx_deal_analyses_created_at_desc" ON "deal_analyses"("created_at" DESC);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'deal_analyses_property_id_fkey'
  ) THEN
    ALTER TABLE "deal_analyses" ADD CONSTRAINT "deal_analyses_property_id_fkey"
      FOREIGN KEY ("property_id") REFERENCES "fsbo_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "deal_analysis_factors" (
    "id" TEXT NOT NULL,
    "analysis_id" TEXT NOT NULL,
    "factor_code" TEXT NOT NULL,
    "factor_category" TEXT NOT NULL,
    "factor_value" INTEGER NOT NULL,
    "weight" DECIMAL(5,4) NOT NULL,
    "impact" TEXT NOT NULL,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deal_analysis_factors_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_deal_analysis_factors_analysis_id" ON "deal_analysis_factors"("analysis_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'deal_analysis_factors_analysis_id_fkey'
  ) THEN
    ALTER TABLE "deal_analysis_factors" ADD CONSTRAINT "deal_analysis_factors_analysis_id_fkey"
      FOREIGN KEY ("analysis_id") REFERENCES "deal_analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "deal_analysis_scenarios" (
    "id" TEXT NOT NULL,
    "analysis_id" TEXT NOT NULL,
    "scenario_type" TEXT NOT NULL,
    "monthly_rent" INTEGER,
    "occupancy_rate" DECIMAL(5,4),
    "operating_cost" INTEGER,
    "mortgage_cost" INTEGER,
    "monthly_cash_flow" INTEGER,
    "annual_roi" DECIMAL(7,4),
    "cap_rate" DECIMAL(7,4),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deal_analysis_scenarios_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_deal_analysis_scenarios_analysis_id" ON "deal_analysis_scenarios"("analysis_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'deal_analysis_scenarios_analysis_id_fkey'
  ) THEN
    ALTER TABLE "deal_analysis_scenarios" ADD CONSTRAINT "deal_analysis_scenarios_analysis_id_fkey"
      FOREIGN KEY ("analysis_id") REFERENCES "deal_analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
