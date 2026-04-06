-- BNHub AI autopilot & smart pricing

CREATE TYPE "AiSuggestionType" AS ENUM (
  'PRICE_INCREASE',
  'PRICE_DECREASE',
  'PROMOTION_SUGGESTION',
  'DESCRIPTION_IMPROVEMENT',
  'TITLE_IMPROVEMENT',
  'AMENITIES_IMPROVEMENT',
  'PHOTO_QUALITY_WARNING',
  'DEMAND_ALERT'
);

CREATE TYPE "AiSuggestionStatus" AS ENUM ('PENDING', 'APPLIED', 'DISMISSED', 'FAILED');

CREATE TYPE "AutopilotMode" AS ENUM ('OFF', 'ASSIST', 'SAFE_AUTOPILOT', 'FULL_AUTOPILOT_APPROVAL');

CREATE TYPE "AiAutopilotActionType" AS ENUM ('UPDATE_PRICE', 'CREATE_PROMOTION', 'OPTIMIZE_DESCRIPTION', 'OPTIMIZE_TITLE');

CREATE TYPE "AiAutopilotActionStatus" AS ENUM ('PENDING', 'APPROVED', 'EXECUTED', 'REJECTED', 'FAILED');

CREATE TABLE "bnhub_listing_pricing_snapshots" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "captured_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "base_price" DOUBLE PRECISION NOT NULL,
    "suggested_price" DOUBLE PRECISION,
    "applied_price" DOUBLE PRECISION,
    "occupancy_rate" DOUBLE PRECISION,
    "booking_velocity" DOUBLE PRECISION,
    "views_count" INTEGER,
    "demand_score" DOUBLE PRECISION,
    "seasonality_score" DOUBLE PRECISION,
    "competition_score" DOUBLE PRECISION,
    "reason_summary" TEXT,
    "confidence_score" DOUBLE PRECISION,

    CONSTRAINT "bnhub_listing_pricing_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bnhub_ai_suggestions" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT,
    "host_id" TEXT,
    "type" "AiSuggestionType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "payload" JSONB,
    "confidence_score" DOUBLE PRECISION,
    "status" "AiSuggestionStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bnhub_ai_suggestions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bnhub_host_autopilot_settings" (
    "id" TEXT NOT NULL,
    "host_id" TEXT NOT NULL,
    "mode" "AutopilotMode" NOT NULL DEFAULT 'ASSIST',
    "auto_pricing" BOOLEAN NOT NULL DEFAULT true,
    "auto_promotions" BOOLEAN NOT NULL DEFAULT false,
    "auto_listing_optimization" BOOLEAN NOT NULL DEFAULT false,
    "auto_messaging" BOOLEAN NOT NULL DEFAULT false,
    "min_price" DOUBLE PRECISION,
    "max_price" DOUBLE PRECISION,
    "max_daily_change_pct" DOUBLE PRECISION DEFAULT 15,
    "require_approval_for_pricing" BOOLEAN NOT NULL DEFAULT true,
    "require_approval_for_promotions" BOOLEAN NOT NULL DEFAULT true,
    "paused" BOOLEAN NOT NULL DEFAULT false,
    "pause_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bnhub_host_autopilot_settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "bnhub_host_autopilot_settings_host_id_key" ON "bnhub_host_autopilot_settings"("host_id");

CREATE TABLE "bnhub_ai_autopilot_actions" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT,
    "host_id" TEXT,
    "action_type" "AiAutopilotActionType" NOT NULL,
    "status" "AiAutopilotActionStatus" NOT NULL DEFAULT 'PENDING',
    "input_payload" JSONB,
    "result_payload" JSONB,
    "reason_summary" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "executed_at" TIMESTAMP(3),
    "reviewed_at" TIMESTAMP(3),

    CONSTRAINT "bnhub_ai_autopilot_actions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "bnhub_listing_pricing_snapshots_listing_id_captured_at_idx" ON "bnhub_listing_pricing_snapshots"("listing_id", "captured_at");

CREATE INDEX "bnhub_ai_suggestions_listing_id_status_idx" ON "bnhub_ai_suggestions"("listing_id", "status");
CREATE INDEX "bnhub_ai_suggestions_host_id_status_idx" ON "bnhub_ai_suggestions"("host_id", "status");
CREATE INDEX "bnhub_ai_suggestions_type_status_idx" ON "bnhub_ai_suggestions"("type", "status");

CREATE INDEX "bnhub_ai_autopilot_actions_listing_id_status_idx" ON "bnhub_ai_autopilot_actions"("listing_id", "status");
CREATE INDEX "bnhub_ai_autopilot_actions_host_id_status_idx" ON "bnhub_ai_autopilot_actions"("host_id", "status");
CREATE INDEX "bnhub_ai_autopilot_actions_action_type_status_idx" ON "bnhub_ai_autopilot_actions"("action_type", "status");

ALTER TABLE "bnhub_listing_pricing_snapshots" ADD CONSTRAINT "bnhub_listing_pricing_snapshots_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bnhub_ai_suggestions" ADD CONSTRAINT "bnhub_ai_suggestions_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bnhub_ai_suggestions" ADD CONSTRAINT "bnhub_ai_suggestions_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bnhub_host_autopilot_settings" ADD CONSTRAINT "bnhub_host_autopilot_settings_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bnhub_ai_autopilot_actions" ADD CONSTRAINT "bnhub_ai_autopilot_actions_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bnhub_ai_autopilot_actions" ADD CONSTRAINT "bnhub_ai_autopilot_actions_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
