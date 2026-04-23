-- AI Buy Box: strategy definitions and ranked matches (inventory-backed).

CREATE TABLE IF NOT EXISTS "investor_buy_boxes" (
    "id" TEXT NOT NULL,
    "owner_type" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "city" TEXT,
    "province" TEXT NOT NULL DEFAULT 'QC',
    "property_type" TEXT,
    "min_price_cents" INTEGER,
    "max_price_cents" INTEGER,
    "min_cap_rate" DOUBLE PRECISION,
    "min_roi" DOUBLE PRECISION,
    "min_cashflow_cents" INTEGER,
    "min_dscr" DOUBLE PRECISION,
    "max_risk_score" DOUBLE PRECISION,
    "required_zone" TEXT,
    "preferred_neighborhoods" JSONB,
    "min_bedrooms" INTEGER,
    "min_bathrooms" DOUBLE PRECISION,
    "min_area_sqft" DOUBLE PRECISION,
    "max_area_sqft" DOUBLE PRECISION,
    "strategy_type" TEXT,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "investor_buy_boxes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_investor_buy_boxes_owner_active" ON "investor_buy_boxes"("owner_type", "owner_id", "active");

CREATE TABLE IF NOT EXISTS "buy_box_matches" (
    "id" TEXT NOT NULL,
    "investor_buy_box_id" TEXT NOT NULL,
    "deal_candidate_id" TEXT,
    "listing_id" TEXT,
    "match_score" DOUBLE PRECISION NOT NULL,
    "match_label" TEXT,
    "ai_summary" TEXT,
    "rationale" JSONB,
    "seen" BOOLEAN NOT NULL DEFAULT false,
    "bookmarked" BOOLEAN NOT NULL DEFAULT false,
    "alerted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "buy_box_matches_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "buy_box_matches_box_listing_key" ON "buy_box_matches"("investor_buy_box_id", "listing_id");
CREATE INDEX IF NOT EXISTS "idx_buy_box_matches_box_score" ON "buy_box_matches"("investor_buy_box_id", "match_score" DESC);

ALTER TABLE "buy_box_matches" ADD CONSTRAINT "buy_box_matches_investor_buy_box_id_fkey" FOREIGN KEY ("investor_buy_box_id") REFERENCES "investor_buy_boxes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
