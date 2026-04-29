-- Prerequisite: listing_analytics_share_unlock ALTERs listing_analytics before demand_engine CREATE (ordering bug).
-- Idempotent DDL so 20260415120000 can still run cleanly on installs that skip this revision.

DO $$ BEGIN
  CREATE TYPE "ListingAnalyticsKind" AS ENUM ('FSBO', 'CRM', 'BNHUB');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "listing_analytics" (
    "id" TEXT NOT NULL,
    "listing_kind" "ListingAnalyticsKind" NOT NULL,
    "listing_id" TEXT NOT NULL,
    "views_total" INTEGER NOT NULL DEFAULT 0,
    "saves" INTEGER NOT NULL DEFAULT 0,
    "contact_clicks" INTEGER NOT NULL DEFAULT 0,
    "booking_attempts" INTEGER NOT NULL DEFAULT 0,
    "bookings" INTEGER NOT NULL DEFAULT 0,
    "demand_score" INTEGER NOT NULL DEFAULT 0,
    "demand_score_computed_at" TIMESTAMP(3),
    "views_24h_cached" INTEGER NOT NULL DEFAULT 0,
    "unique_views_24h_cached" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listing_analytics_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "listing_analytics_listing_kind_listing_id_key" ON "listing_analytics"("listing_kind", "listing_id");
CREATE INDEX IF NOT EXISTS "listing_analytics_listing_kind_listing_id_idx" ON "listing_analytics"("listing_kind", "listing_id");
CREATE INDEX IF NOT EXISTS "listing_analytics_demand_score_idx" ON "listing_analytics"("demand_score");

CREATE TABLE IF NOT EXISTS "listing_price_history" (
    "id" TEXT NOT NULL,
    "listing_kind" "ListingAnalyticsKind" NOT NULL,
    "listing_id" TEXT NOT NULL,
    "price_cents" INTEGER NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listing_price_history_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "listing_price_history_listing_kind_listing_id_recorded_at_idx" ON "listing_price_history"("listing_kind", "listing_id", "recorded_at");
