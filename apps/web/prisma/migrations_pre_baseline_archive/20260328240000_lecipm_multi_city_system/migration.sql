-- LECIPM multi-city expansion: canonical City config, user home market, FSBO country/region

CREATE TABLE "lecipm_cities" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'CA',
    "region" TEXT,
    "status" TEXT NOT NULL DEFAULT 'testing',
    "launch_date" TIMESTAMPTZ(6),
    "listings_enabled" BOOLEAN NOT NULL DEFAULT false,
    "search_pages_enabled" BOOLEAN NOT NULL DEFAULT false,
    "growth_engine_enabled" BOOLEAN NOT NULL DEFAULT false,
    "playbook_messaging" TEXT,
    "playbook_pricing" TEXT,
    "playbook_strategy" TEXT,
    "expansion_score" INTEGER,
    "city_match_terms" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "lecipm_cities_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "lecipm_cities_slug_key" ON "lecipm_cities"("slug");

CREATE INDEX "lecipm_cities_status_idx" ON "lecipm_cities"("status");

CREATE INDEX "lecipm_cities_country_idx" ON "lecipm_cities"("country");

INSERT INTO "lecipm_cities" ("id", "slug", "name", "country", "region", "status", "city_match_terms", "listings_enabled", "search_pages_enabled", "growth_engine_enabled", "updated_at")
VALUES
  (gen_random_uuid()::text, 'montreal', 'Montréal', 'CA', 'QC', 'active', ARRAY['montreal', 'montréal', 'mont-real'], true, true, true, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'laval', 'Laval', 'CA', 'QC', 'active', ARRAY['laval'], true, true, true, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'quebec', 'Quebec City', 'CA', 'QC', 'active', ARRAY['quebec', 'québec', 'quebec city', 'ville-de-quebec'], true, true, true, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'new-york', 'New York', 'US', 'NY', 'testing', ARRAY['new york', 'nyc', 'new-york'], false, false, false, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'miami', 'Miami', 'US', 'FL', 'testing', ARRAY['miami'], false, false, false, CURRENT_TIMESTAMP);

ALTER TABLE "User" ADD COLUMN "home_city" TEXT;
ALTER TABLE "User" ADD COLUMN "home_region" TEXT;
ALTER TABLE "User" ADD COLUMN "home_country" TEXT;
ALTER TABLE "User" ADD COLUMN "lecipm_city_id" TEXT;

CREATE INDEX "User_lecipm_city_id_idx" ON "User"("lecipm_city_id");

ALTER TABLE "User" ADD CONSTRAINT "User_lecipm_city_id_fkey" FOREIGN KEY ("lecipm_city_id") REFERENCES "lecipm_cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "fsbo_listings" ADD COLUMN "country" TEXT NOT NULL DEFAULT 'CA';
ALTER TABLE "fsbo_listings" ADD COLUMN "region" TEXT;
