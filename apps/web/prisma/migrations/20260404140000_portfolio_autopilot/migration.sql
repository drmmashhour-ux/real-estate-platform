-- CreateEnum
CREATE TYPE "PortfolioAutopilotMode" AS ENUM ('off', 'assist', 'safe_autopilot', 'approval_required');

-- CreateEnum
CREATE TYPE "PortfolioAutopilotActionPriority" AS ENUM ('high', 'medium', 'low');

-- CreateEnum
CREATE TYPE "PortfolioAutopilotActionStatus" AS ENUM ('suggested', 'approved', 'rejected', 'applied');

-- CreateTable
CREATE TABLE "portfolio_autopilot_settings" (
    "id" TEXT NOT NULL,
    "owner_user_id" TEXT NOT NULL,
    "mode" "PortfolioAutopilotMode" NOT NULL DEFAULT 'assist',
    "auto_run_listing_optimization" BOOLEAN NOT NULL DEFAULT true,
    "auto_generate_content_for_top_listings" BOOLEAN NOT NULL DEFAULT true,
    "auto_flag_weak_listings" BOOLEAN NOT NULL DEFAULT true,
    "allow_price_recommendations" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "portfolio_autopilot_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolio_health_scores" (
    "id" TEXT NOT NULL,
    "owner_user_id" TEXT NOT NULL,
    "portfolio_health_score" INTEGER NOT NULL DEFAULT 0,
    "revenue_health" INTEGER NOT NULL DEFAULT 0,
    "quality_health" INTEGER NOT NULL DEFAULT 0,
    "performance_health" INTEGER NOT NULL DEFAULT 0,
    "behavior_health" INTEGER NOT NULL DEFAULT 0,
    "trust_health" INTEGER NOT NULL DEFAULT 0,
    "summary" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "portfolio_health_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolio_autopilot_actions" (
    "id" TEXT NOT NULL,
    "owner_user_id" TEXT NOT NULL,
    "action_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" "PortfolioAutopilotActionPriority" NOT NULL DEFAULT 'medium',
    "status" "PortfolioAutopilotActionStatus" NOT NULL DEFAULT 'suggested',
    "metadata_json" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "portfolio_autopilot_actions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "portfolio_autopilot_settings_owner_user_id_key" ON "portfolio_autopilot_settings"("owner_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "portfolio_health_scores_owner_user_id_key" ON "portfolio_health_scores"("owner_user_id");

-- CreateIndex
CREATE INDEX "portfolio_autopilot_actions_owner_user_id_idx" ON "portfolio_autopilot_actions"("owner_user_id");

-- CreateIndex
CREATE INDEX "portfolio_autopilot_actions_priority_idx" ON "portfolio_autopilot_actions"("priority");

-- CreateIndex
CREATE INDEX "portfolio_autopilot_actions_status_idx" ON "portfolio_autopilot_actions"("status");

-- AddForeignKey
ALTER TABLE "portfolio_autopilot_settings" ADD CONSTRAINT "portfolio_autopilot_settings_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_health_scores" ADD CONSTRAINT "portfolio_health_scores_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_autopilot_actions" ADD CONSTRAINT "portfolio_autopilot_actions_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
