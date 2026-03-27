CREATE TYPE "watchlist_alert_status" AS ENUM ('unread', 'read', 'dismissed');
CREATE TYPE "watchlist_alert_severity" AS ENUM ('info', 'warning', 'critical');
CREATE TYPE "watchlist_alert_type" AS ENUM (
  'price_changed',
  'deal_score_up',
  'deal_score_down',
  'trust_score_changed',
  'fraud_risk_up',
  'confidence_up',
  'confidence_down',
  'listing_status_changed',
  'strong_opportunity_detected',
  'needs_review_detected'
);

CREATE TABLE "watchlists" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "watchlists_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "watchlist_items" (
  "id" TEXT NOT NULL,
  "watchlist_id" TEXT NOT NULL,
  "listing_id" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "watchlist_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "watchlist_alerts" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "watchlist_id" TEXT,
  "listing_id" TEXT NOT NULL,
  "alert_type" "watchlist_alert_type" NOT NULL,
  "severity" "watchlist_alert_severity" NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "metadata" JSONB,
  "status" "watchlist_alert_status" NOT NULL DEFAULT 'unread',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "watchlist_alerts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "watchlist_snapshots" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "listing_id" TEXT NOT NULL,
  "deal_score" INTEGER,
  "trust_score" INTEGER,
  "fraud_score" INTEGER,
  "confidence" INTEGER,
  "recommendation" TEXT,
  "price" INTEGER,
  "listing_status" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "watchlist_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "watchlists_user_id_idx" ON "watchlists"("user_id");
CREATE UNIQUE INDEX "watchlist_items_watchlist_id_listing_id_key" ON "watchlist_items"("watchlist_id", "listing_id");
CREATE INDEX "watchlist_items_listing_id_idx" ON "watchlist_items"("listing_id");
CREATE INDEX "watchlist_alerts_user_id_status_idx" ON "watchlist_alerts"("user_id", "status");
CREATE INDEX "watchlist_alerts_listing_id_created_at_idx" ON "watchlist_alerts"("listing_id", "created_at");
CREATE INDEX "watchlist_snapshots_user_id_listing_id_created_at_idx" ON "watchlist_snapshots"("user_id", "listing_id", "created_at");

ALTER TABLE "watchlists" ADD CONSTRAINT "watchlists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "watchlist_items" ADD CONSTRAINT "watchlist_items_watchlist_id_fkey" FOREIGN KEY ("watchlist_id") REFERENCES "watchlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "watchlist_items" ADD CONSTRAINT "watchlist_items_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "fsbo_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "watchlist_alerts" ADD CONSTRAINT "watchlist_alerts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "watchlist_alerts" ADD CONSTRAINT "watchlist_alerts_watchlist_id_fkey" FOREIGN KEY ("watchlist_id") REFERENCES "watchlists"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "watchlist_alerts" ADD CONSTRAINT "watchlist_alerts_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "fsbo_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "watchlist_snapshots" ADD CONSTRAINT "watchlist_snapshots_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "watchlist_snapshots" ADD CONSTRAINT "watchlist_snapshots_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "fsbo_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
