-- Multi-market expansion: configurable countries, city ↔ country links, listing FKs.

CREATE TABLE "expansion_countries" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(8) NOT NULL,
    "name" TEXT NOT NULL,
    "default_locale" VARCHAR(16) NOT NULL DEFAULT 'en',
    "supported_locales" TEXT[] NOT NULL DEFAULT ARRAY['en', 'fr']::TEXT[],
    "currency" VARCHAR(8) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "regional_config_json" JSONB,

    CONSTRAINT "expansion_countries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "expansion_countries_code_key" ON "expansion_countries"("code");
CREATE INDEX "expansion_countries_is_active_idx" ON "expansion_countries"("is_active");

ALTER TABLE "lecipm_cities" ADD COLUMN "expansion_country_id" TEXT;
ALTER TABLE "lecipm_cities" ADD COLUMN "market_is_active" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "bnhub_listings" ADD COLUMN "market_country_id" TEXT;
ALTER TABLE "bnhub_listings" ADD COLUMN "market_city_id" TEXT;

ALTER TABLE "fsbo_listings" ADD COLUMN "market_country_id" TEXT;
ALTER TABLE "fsbo_listings" ADD COLUMN "market_city_id" TEXT;
ALTER TABLE "fsbo_listings" ADD COLUMN "listing_currency" VARCHAR(8);

CREATE INDEX "lecipm_cities_expansion_country_id_idx" ON "lecipm_cities"("expansion_country_id");
CREATE INDEX "lecipm_cities_market_is_active_idx" ON "lecipm_cities"("market_is_active");
CREATE INDEX "bnhub_listings_market_country_id_idx" ON "bnhub_listings"("market_country_id");
CREATE INDEX "bnhub_listings_market_city_id_idx" ON "bnhub_listings"("market_city_id");
CREATE INDEX "fsbo_listings_market_country_id_idx" ON "fsbo_listings"("market_country_id");
CREATE INDEX "fsbo_listings_market_city_id_idx" ON "fsbo_listings"("market_city_id");

ALTER TABLE "lecipm_cities" ADD CONSTRAINT "lecipm_cities_expansion_country_id_fkey" FOREIGN KEY ("expansion_country_id") REFERENCES "expansion_countries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "bnhub_listings" ADD CONSTRAINT "bnhub_listings_market_country_id_fkey" FOREIGN KEY ("market_country_id") REFERENCES "expansion_countries"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "bnhub_listings" ADD CONSTRAINT "bnhub_listings_market_city_id_fkey" FOREIGN KEY ("market_city_id") REFERENCES "lecipm_cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "fsbo_listings" ADD CONSTRAINT "fsbo_listings_market_country_id_fkey" FOREIGN KEY ("market_country_id") REFERENCES "expansion_countries"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "fsbo_listings" ADD CONSTRAINT "fsbo_listings_market_city_id_fkey" FOREIGN KEY ("market_city_id") REFERENCES "lecipm_cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
