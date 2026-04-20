-- Centris / distribution: external syndication rows + CRM lead attribution.
-- Compliance: connector-based only — no scraped Centris payloads stored here.

CREATE TABLE "external_listings" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "external_id" TEXT,
    "status" TEXT NOT NULL,
    "last_sync_at" TIMESTAMP(3),
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "external_listings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "external_listings_listing_id_platform_key" ON "external_listings"("listing_id", "platform");

CREATE INDEX "external_listings_platform_status_idx" ON "external_listings"("platform", "status");

ALTER TABLE "external_listings" ADD CONSTRAINT "external_listings_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "fsbo_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "distribution_channel" VARCHAR(32);
