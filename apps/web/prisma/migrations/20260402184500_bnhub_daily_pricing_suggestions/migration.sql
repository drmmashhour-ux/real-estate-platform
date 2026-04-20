-- BNHub rule-based nightly price suggestions (advisory only; never updates listing price here).

ALTER TABLE "bnhub_listings" ADD COLUMN "pricing_suggestions_enabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "bnhub_listings" ADD COLUMN "pricing_min_night_dollars" DOUBLE PRECISION;
ALTER TABLE "bnhub_listings" ADD COLUMN "pricing_max_night_dollars" DOUBLE PRECISION;

CREATE TABLE "bnhub_pricing_suggestions" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "suggested" DOUBLE PRECISION NOT NULL,
    "base_price" DOUBLE PRECISION NOT NULL,
    "demand_score" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bnhub_pricing_suggestions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "bnhub_pricing_suggestions_listing_id_date_key" ON "bnhub_pricing_suggestions"("listing_id", "date");
CREATE INDEX "bnhub_pricing_suggestions_listing_id_date_idx" ON "bnhub_pricing_suggestions"("listing_id", "date");

ALTER TABLE "bnhub_pricing_suggestions" ADD CONSTRAINT "bnhub_pricing_suggestions_listing_id_fkey"
  FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
