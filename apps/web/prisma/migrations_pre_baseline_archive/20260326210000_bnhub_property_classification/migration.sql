-- BNHub Property Star Rating & Classification (AI-based estimate; not official hotel stars)

CREATE TABLE "bnhub_property_classification" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "overall_score" INTEGER NOT NULL,
    "star_rating" INTEGER NOT NULL,
    "amenities_score" INTEGER NOT NULL,
    "comfort_score" INTEGER NOT NULL,
    "services_score" INTEGER NOT NULL,
    "safety_score" INTEGER NOT NULL,
    "completeness_score" INTEGER NOT NULL,
    "luxury_score" INTEGER NOT NULL,
    "ai_adjustment_score" INTEGER NOT NULL,
    "breakdown_json" JSONB,
    "computed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bnhub_property_classification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "bnhub_property_classification_listing_id_key" ON "bnhub_property_classification"("listing_id");

CREATE INDEX "bnhub_property_classification_listing_id_idx" ON "bnhub_property_classification"("listing_id");

ALTER TABLE "bnhub_property_classification" ADD CONSTRAINT "bnhub_property_classification_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
