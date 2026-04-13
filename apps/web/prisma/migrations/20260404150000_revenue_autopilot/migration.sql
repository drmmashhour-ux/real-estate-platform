-- CreateEnum
CREATE TYPE "RevenueAutopilotMode" AS ENUM ('off', 'assist', 'safe_autopilot', 'approval_required');

-- CreateEnum
CREATE TYPE "RevenueAutopilotScopeType" AS ENUM ('platform', 'owner');

-- CreateEnum
CREATE TYPE "RevenueAutopilotActionPriority" AS ENUM ('high', 'medium', 'low');

-- CreateEnum
CREATE TYPE "RevenueAutopilotActionStatus" AS ENUM ('suggested', 'approved', 'rejected', 'applied');

-- CreateTable
CREATE TABLE "revenue_autopilot_settings" (
    "id" TEXT NOT NULL,
    "scope_type" "RevenueAutopilotScopeType" NOT NULL,
    "scope_id" TEXT NOT NULL,
    "mode" "RevenueAutopilotMode" NOT NULL DEFAULT 'assist',
    "auto_promote_top_listings" BOOLEAN NOT NULL DEFAULT true,
    "auto_generate_revenue_actions" BOOLEAN NOT NULL DEFAULT true,
    "allow_price_recommendations" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "revenue_autopilot_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revenue_health_scores" (
    "id" TEXT NOT NULL,
    "scope_type" "RevenueAutopilotScopeType" NOT NULL,
    "scope_id" TEXT NOT NULL,
    "revenue_score" INTEGER NOT NULL DEFAULT 0,
    "trend_score" INTEGER NOT NULL DEFAULT 0,
    "conversion_score" INTEGER NOT NULL DEFAULT 0,
    "pricing_efficiency_score" INTEGER NOT NULL DEFAULT 0,
    "portfolio_mix_score" INTEGER NOT NULL DEFAULT 0,
    "summary" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "revenue_health_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revenue_autopilot_actions" (
    "id" TEXT NOT NULL,
    "scope_type" "RevenueAutopilotScopeType" NOT NULL,
    "scope_id" TEXT NOT NULL,
    "listing_id" TEXT,
    "action_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "estimated_uplift_cents" INTEGER,
    "priority" "RevenueAutopilotActionPriority" NOT NULL DEFAULT 'medium',
    "status" "RevenueAutopilotActionStatus" NOT NULL DEFAULT 'suggested',
    "metadata_json" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "revenue_autopilot_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revenue_opportunity_logs" (
    "id" TEXT NOT NULL,
    "scope_type" "RevenueAutopilotScopeType" NOT NULL,
    "scope_id" TEXT NOT NULL,
    "listing_id" TEXT,
    "opportunity_type" TEXT NOT NULL,
    "current_revenue_cents" INTEGER,
    "estimated_revenue_cents" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "revenue_opportunity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "revenue_autopilot_settings_scope_type_scope_id_key" ON "revenue_autopilot_settings"("scope_type", "scope_id");

-- CreateIndex
CREATE INDEX "revenue_autopilot_settings_scope_type_scope_id_idx" ON "revenue_autopilot_settings"("scope_type", "scope_id");

-- CreateIndex
CREATE UNIQUE INDEX "revenue_health_scores_scope_type_scope_id_key" ON "revenue_health_scores"("scope_type", "scope_id");

-- CreateIndex
CREATE INDEX "revenue_health_scores_scope_type_scope_id_idx" ON "revenue_health_scores"("scope_type", "scope_id");

-- CreateIndex
CREATE INDEX "revenue_autopilot_actions_scope_type_scope_id_idx" ON "revenue_autopilot_actions"("scope_type", "scope_id");

-- CreateIndex
CREATE INDEX "revenue_autopilot_actions_priority_idx" ON "revenue_autopilot_actions"("priority");

-- CreateIndex
CREATE INDEX "revenue_autopilot_actions_status_idx" ON "revenue_autopilot_actions"("status");

-- CreateIndex
CREATE INDEX "revenue_autopilot_actions_listing_id_idx" ON "revenue_autopilot_actions"("listing_id");

-- CreateIndex
CREATE INDEX "revenue_opportunity_logs_scope_type_scope_id_idx" ON "revenue_opportunity_logs"("scope_type", "scope_id");

-- CreateIndex
CREATE INDEX "revenue_opportunity_logs_listing_id_idx" ON "revenue_opportunity_logs"("listing_id");
