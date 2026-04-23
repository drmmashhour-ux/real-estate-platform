-- City heatmap zones + optional copilot conversation context (additive).

ALTER TABLE "copilot_conversations" ADD COLUMN IF NOT EXISTS "context_type" VARCHAR(32);

CREATE TABLE IF NOT EXISTS "city_activity_zones" (
    "id" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "province" TEXT NOT NULL DEFAULT 'QC',
    "zone_key" TEXT NOT NULL,
    "center_lat" DOUBLE PRECISION NOT NULL,
    "center_lng" DOUBLE PRECISION NOT NULL,
    "listings_count" INTEGER NOT NULL DEFAULT 0,
    "sold_count" INTEGER NOT NULL DEFAULT 0,
    "reservations_count" INTEGER NOT NULL DEFAULT 0,
    "deal_count" INTEGER NOT NULL DEFAULT 0,
    "visitors_count" INTEGER NOT NULL DEFAULT 0,
    "activity_score" DOUBLE PRECISION,
    "activity_label" TEXT,
    "data_scope_note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "city_activity_zones_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "city_activity_zones_city_zone_key" ON "city_activity_zones"("city", "zone_key");
CREATE INDEX IF NOT EXISTS "city_activity_zones_city_province_idx" ON "city_activity_zones"("city", "province");
