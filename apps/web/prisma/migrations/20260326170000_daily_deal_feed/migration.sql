-- Daily deal feed persistence
CREATE TYPE "daily_deal_feed_interaction_type" AS ENUM (
  'viewed',
  'saved',
  'ignored',
  'analyzed',
  'contacted',
  'clicked',
  'dismissed'
);

CREATE TABLE "daily_deal_feed_snapshots" (
  "id" TEXT NOT NULL,
  "user_id" TEXT,
  "workspace_id" TEXT,
  "generated_for_date" TIMESTAMP(3) NOT NULL,
  "feed_type" TEXT NOT NULL,
  "item_count" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "daily_deal_feed_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "daily_deal_feed_items" (
  "id" TEXT NOT NULL,
  "snapshot_id" TEXT NOT NULL,
  "listing_id" TEXT NOT NULL,
  "rank_position" INTEGER NOT NULL,
  "feed_bucket" TEXT NOT NULL,
  "score" INTEGER NOT NULL,
  "trust_score" INTEGER NOT NULL,
  "deal_score" INTEGER NOT NULL,
  "confidence" INTEGER NOT NULL,
  "explanation" JSONB,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "daily_deal_feed_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "user_feed_preferences" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "preferred_cities" JSONB,
  "preferred_property_types" JSONB,
  "preferred_modes" JSONB,
  "budget_min" INTEGER,
  "budget_max" INTEGER,
  "strategy_mode" TEXT,
  "risk_tolerance" TEXT,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_feed_preferences_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "feed_interactions" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "listing_id" TEXT NOT NULL,
  "interaction_type" "daily_deal_feed_interaction_type" NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "feed_interactions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_feed_preferences_user_id_key" ON "user_feed_preferences"("user_id");
CREATE INDEX "daily_deal_feed_snapshots_user_id_generated_for_date_idx" ON "daily_deal_feed_snapshots"("user_id", "generated_for_date");
CREATE INDEX "daily_deal_feed_snapshots_workspace_id_generated_for_date_idx" ON "daily_deal_feed_snapshots"("workspace_id", "generated_for_date");
CREATE INDEX "daily_deal_feed_items_snapshot_id_rank_position_idx" ON "daily_deal_feed_items"("snapshot_id", "rank_position");
CREATE INDEX "daily_deal_feed_items_listing_id_idx" ON "daily_deal_feed_items"("listing_id");
CREATE INDEX "feed_interactions_user_id_created_at_idx" ON "feed_interactions"("user_id", "created_at");
CREATE INDEX "feed_interactions_listing_id_created_at_idx" ON "feed_interactions"("listing_id", "created_at");

ALTER TABLE "daily_deal_feed_snapshots"
  ADD CONSTRAINT "daily_deal_feed_snapshots_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "daily_deal_feed_items"
  ADD CONSTRAINT "daily_deal_feed_items_snapshot_id_fkey"
  FOREIGN KEY ("snapshot_id") REFERENCES "daily_deal_feed_snapshots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "daily_deal_feed_items"
  ADD CONSTRAINT "daily_deal_feed_items_listing_id_fkey"
  FOREIGN KEY ("listing_id") REFERENCES "fsbo_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_feed_preferences"
  ADD CONSTRAINT "user_feed_preferences_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "feed_interactions"
  ADD CONSTRAINT "feed_interactions_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "feed_interactions"
  ADD CONSTRAINT "feed_interactions_listing_id_fkey"
  FOREIGN KEY ("listing_id") REFERENCES "fsbo_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
