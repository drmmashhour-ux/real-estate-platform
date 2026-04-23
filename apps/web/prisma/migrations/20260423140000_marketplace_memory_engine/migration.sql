-- Marketplace memory engine (LECIPM / BNHub)

CREATE TYPE "MarketplaceMemoryRole" AS ENUM ('BUYER', 'RENTER', 'BROKER', 'INVESTOR');
CREATE TYPE "MarketplaceMemoryEventType" AS ENUM ('VIEW', 'SEARCH', 'SAVE', 'MESSAGE', 'OFFER', 'BOOK', 'INVEST', 'SIGN');
CREATE TYPE "MarketplaceMemoryEntityType" AS ENUM ('LISTING', 'DEAL', 'PACKET');
CREATE TYPE "MarketplaceMemoryInsightType" AS ENUM ('PREFERENCE', 'INTENT', 'RISK', 'TIMING', 'LOCATION_AFFINITY');

CREATE TABLE "user_memory_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "MarketplaceMemoryRole" NOT NULL DEFAULT 'BUYER',
    "intent_summary_json" JSONB NOT NULL DEFAULT '{}',
    "preference_summary_json" JSONB NOT NULL DEFAULT '{}',
    "behavior_summary_json" JSONB NOT NULL DEFAULT '{}',
    "financial_profile_json" JSONB,
    "esg_profile_json" JSONB,
    "risk_profile_json" JSONB,
    "personalization_enabled" BOOLEAN NOT NULL DEFAULT true,
    "last_updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_memory_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_memory_profiles_user_id_key" ON "user_memory_profiles"("user_id");

ALTER TABLE "user_memory_profiles" ADD CONSTRAINT "user_memory_profiles_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "user_memory_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "event_type" "MarketplaceMemoryEventType" NOT NULL,
    "entity_type" "MarketplaceMemoryEntityType" NOT NULL,
    "entity_id" VARCHAR(64) NOT NULL,
    "metadata_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_memory_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "user_memory_events_user_id_created_at_idx" ON "user_memory_events"("user_id", "created_at" DESC);
CREATE INDEX "user_memory_events_user_id_event_type_created_at_idx" ON "user_memory_events"("user_id", "event_type", "created_at" DESC);

ALTER TABLE "user_memory_events" ADD CONSTRAINT "user_memory_events_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "user_memory_insights" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "insight_type" "MarketplaceMemoryInsightType" NOT NULL,
    "key" VARCHAR(128) NOT NULL,
    "value" TEXT NOT NULL,
    "confidence_score" DOUBLE PRECISION NOT NULL,
    "source_events_json" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_memory_insights_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "user_memory_insights_user_id_created_at_idx" ON "user_memory_insights"("user_id", "created_at" DESC);
CREATE INDEX "user_memory_insights_user_id_insight_type_idx" ON "user_memory_insights"("user_id", "insight_type");

ALTER TABLE "user_memory_insights" ADD CONSTRAINT "user_memory_insights_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "user_memory_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "session_id" VARCHAR(128) NOT NULL,
    "active_intent_json" JSONB NOT NULL DEFAULT '{}',
    "last_activity_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_memory_sessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_memory_sessions_user_id_session_id_key" ON "user_memory_sessions"("user_id", "session_id");
CREATE INDEX "user_memory_sessions_user_id_last_activity_at_idx" ON "user_memory_sessions"("user_id", "last_activity_at" DESC);

ALTER TABLE "user_memory_sessions" ADD CONSTRAINT "user_memory_sessions_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
