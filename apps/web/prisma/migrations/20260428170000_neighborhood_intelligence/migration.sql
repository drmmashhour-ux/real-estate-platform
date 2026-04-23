-- Neighborhood intelligence + comparable warehouse + zone snapshots.

CREATE TABLE IF NOT EXISTS "comparable_properties" (
    "id" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "province" TEXT NOT NULL DEFAULT 'QC',
    "neighborhood_name" TEXT NOT NULL,
    "sale_price_cents" INTEGER,
    "building_area_sqft" INTEGER,
    "listing_status" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comparable_properties_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_comparable_properties_city_hood" ON "comparable_properties"("city", "neighborhood_name");

CREATE TABLE IF NOT EXISTS "neighborhood_profiles" (
    "id" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "province" TEXT NOT NULL DEFAULT 'QC',
    "neighborhood_key" TEXT NOT NULL,
    "neighborhood_name" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "avg_sale_price_cents" INTEGER,
    "avg_price_per_sqft_cents" INTEGER,
    "avg_rent_cents" INTEGER,
    "inventory_count" INTEGER DEFAULT 0,
    "comparable_count" INTEGER DEFAULT 0,
    "score_overall" DOUBLE PRECISION,
    "score_demand" DOUBLE PRECISION,
    "score_value" DOUBLE PRECISION,
    "score_yield" DOUBLE PRECISION,
    "score_risk" DOUBLE PRECISION,
    "trend_direction" VARCHAR(16),
    "investment_zone" VARCHAR(24),
    "ai_summary" TEXT,
    "metrics" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "neighborhood_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "neighborhood_profiles_neighborhood_key_key" ON "neighborhood_profiles"("neighborhood_key");
CREATE INDEX IF NOT EXISTS "idx_neighborhood_profiles_city_prov" ON "neighborhood_profiles"("city", "province");

CREATE TABLE IF NOT EXISTS "neighborhood_score_runs" (
    "id" TEXT NOT NULL,
    "neighborhood_profile_id" TEXT NOT NULL,
    "run_type" VARCHAR(24) NOT NULL,
    "score_overall" DOUBLE PRECISION NOT NULL,
    "score_demand" DOUBLE PRECISION NOT NULL,
    "score_value" DOUBLE PRECISION NOT NULL,
    "score_yield" DOUBLE PRECISION NOT NULL,
    "score_risk" DOUBLE PRECISION NOT NULL,
    "trend_direction" VARCHAR(16) NOT NULL,
    "investment_zone" VARCHAR(24) NOT NULL,
    "rationale" JSONB,
    "ai_summary" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "neighborhood_score_runs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_neighborhood_score_runs_profile_created" ON "neighborhood_score_runs"("neighborhood_profile_id", "created_at" DESC);

ALTER TABLE "neighborhood_score_runs" ADD CONSTRAINT "neighborhood_score_runs_neighborhood_profile_id_fkey" FOREIGN KEY ("neighborhood_profile_id") REFERENCES "neighborhood_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "investment_zone_snapshots" (
    "id" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "province" TEXT NOT NULL DEFAULT 'QC',
    "zone_type" VARCHAR(24) NOT NULL,
    "neighborhood_key" TEXT NOT NULL,
    "neighborhood_name" TEXT NOT NULL,
    "score_overall" DOUBLE PRECISION,
    "score_yield" DOUBLE PRECISION,
    "score_risk" DOUBLE PRECISION,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "investment_zone_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_investment_zone_snapshots_city" ON "investment_zone_snapshots"("city", "province");
