-- Behavior-based ranking: event stream + cached stats + preference profiles + segment trends

CREATE TYPE "BehaviorEventType" AS ENUM (
  'LISTING_IMPRESSION',
  'LISTING_CLICK',
  'LISTING_SAVE',
  'LISTING_SHARE',
  'LISTING_CONTACT_CLICK',
  'LISTING_UNLOCK_START',
  'LISTING_UNLOCK_SUCCESS',
  'LISTING_BOOKING_ATTEMPT',
  'LISTING_BOOKING_SUCCESS',
  'SEARCH_FILTERS_APPLIED',
  'MAP_PIN_CLICK',
  'SIMILAR_LISTING_CLICK',
  'SEARCH_RESULT_IMPRESSION',
  'DWELL_POSITIVE',
  'DWELL_NEGATIVE'
);

CREATE TABLE "user_behavior_events" (
  "id" TEXT NOT NULL,
  "session_id" VARCHAR(64) NOT NULL,
  "user_id" TEXT,
  "listing_id" TEXT,
  "event_type" "BehaviorEventType" NOT NULL,
  "page_type" VARCHAR(64) NOT NULL,
  "city" VARCHAR(128),
  "category" VARCHAR(64),
  "property_type" VARCHAR(64),
  "price_cents" INTEGER,
  "ai_score_snapshot" DOUBLE PRECISION,
  "metadata_json" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "user_behavior_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "user_behavior_events_session_id_created_at_idx" ON "user_behavior_events"("session_id", "created_at");
CREATE INDEX "user_behavior_events_user_id_created_at_idx" ON "user_behavior_events"("user_id", "created_at");
CREATE INDEX "user_behavior_events_listing_id_created_at_idx" ON "user_behavior_events"("listing_id", "created_at");
CREATE INDEX "user_behavior_events_event_type_created_at_idx" ON "user_behavior_events"("event_type", "created_at");

ALTER TABLE "user_behavior_events"
  ADD CONSTRAINT "user_behavior_events_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "user_behavior_events"
  ADD CONSTRAINT "user_behavior_events_listing_id_fkey"
  FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "listing_learning_stats" (
  "listing_id" TEXT NOT NULL,
  "behavior_score" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
  "click_through_rate" DOUBLE PRECISION,
  "save_rate" DOUBLE PRECISION,
  "contact_rate" DOUBLE PRECISION,
  "unlock_rate" DOUBLE PRECISION,
  "booking_attempt_rate" DOUBLE PRECISION,
  "booking_success_rate" DOUBLE PRECISION,
  "positive_dwell_rate" DOUBLE PRECISION,
  "context_match_boost" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "recent_trend_score" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
  "final_learning_score" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
  "total_weighted_events" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "impression_count_30d" INTEGER NOT NULL DEFAULT 0,
  "engagement_count_30d" INTEGER NOT NULL DEFAULT 0,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "listing_learning_stats_pkey" PRIMARY KEY ("listing_id")
);

ALTER TABLE "listing_learning_stats"
  ADD CONSTRAINT "listing_learning_stats_listing_id_fkey"
  FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "behavior_preference_profiles" (
  "id" TEXT NOT NULL,
  "user_id" TEXT,
  "session_id" TEXT,
  "preferred_cities_json" JSONB NOT NULL DEFAULT '[]',
  "preferred_categories_json" JSONB NOT NULL DEFAULT '[]',
  "preferred_property_types_json" JSONB NOT NULL DEFAULT '[]',
  "preferred_price_bands_json" JSONB NOT NULL DEFAULT '[]',
  "preferred_beds_json" JSONB NOT NULL DEFAULT '[]',
  "preferred_amenities_json" JSONB NOT NULL DEFAULT '[]',
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "behavior_preference_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "behavior_preference_profiles_user_id_key" ON "behavior_preference_profiles"("user_id");
CREATE UNIQUE INDEX "behavior_preference_profiles_session_id_key" ON "behavior_preference_profiles"("session_id");
CREATE INDEX "behavior_preference_profiles_session_id_idx" ON "behavior_preference_profiles"("session_id");

ALTER TABLE "behavior_preference_profiles"
  ADD CONSTRAINT "behavior_preference_profiles_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "market_segment_learning_stats" (
  "id" TEXT NOT NULL,
  "segment_key" VARCHAR(256) NOT NULL,
  "impression_count" INTEGER NOT NULL DEFAULT 0,
  "engagement_weighted" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "trend_score" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "market_segment_learning_stats_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "market_segment_learning_stats_segment_key_key" ON "market_segment_learning_stats"("segment_key");
