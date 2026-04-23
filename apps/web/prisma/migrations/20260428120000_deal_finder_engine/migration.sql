-- AI Deal Finder: scored deal candidates from inventory (advisory / discovery only).

CREATE TABLE IF NOT EXISTS "deal_candidates" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "listing_id" TEXT,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "asking_price_cents" INTEGER,
    "estimated_value_cents" INTEGER,
    "monthly_rent_cents" INTEGER,
    "cap_rate" DOUBLE PRECISION,
    "roi_percent" DOUBLE PRECISION,
    "cashflow_cents" INTEGER,
    "neighborhood_score" DOUBLE PRECISION,
    "investment_zone" TEXT,
    "deal_score" DOUBLE PRECISION,
    "deal_label" TEXT,
    "deal_type" TEXT,
    "ai_summary" TEXT,
    "low_confidence" BOOLEAN NOT NULL DEFAULT false,
    "high_opportunity_alerted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "deal_candidates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "deal_candidates_source_listing_key" ON "deal_candidates"("source", "listing_id");
CREATE INDEX IF NOT EXISTS "idx_deal_candidates_score_desc" ON "deal_candidates"("deal_score" DESC);
