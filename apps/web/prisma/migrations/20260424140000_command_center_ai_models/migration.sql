-- CreateEnum
CREATE TYPE "CommandCenterAlertType" AS ENUM ('RISK', 'OPPORTUNITY', 'APPROVAL', 'FINANCE', 'CLOSING', 'INVESTOR', 'COMPLIANCE');

-- CreateEnum
CREATE TYPE "CommandCenterAlertSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "CommandCenterRecommendationCategory" AS ENUM ('PRIORITIZE', 'APPROVE', 'FOLLOW_UP', 'REVIEW', 'ESCALATE', 'IGNORE');

-- CreateTable
CREATE TABLE "lecipm_command_center_snapshots" (
    "id" TEXT NOT NULL,
    "owner_user_id" VARCHAR(36),
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "summary_json" JSONB NOT NULL,
    "priorities_json" JSONB NOT NULL,
    "risks_json" JSONB NOT NULL,
    "approvals_json" JSONB NOT NULL,
    "execution_json" JSONB NOT NULL,
    "finance_json" JSONB NOT NULL,
    "investment_json" JSONB NOT NULL,
    "closing_json" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lecipm_command_center_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lecipm_command_center_alerts" (
    "id" TEXT NOT NULL,
    "snapshot_id" VARCHAR(36),
    "type" "CommandCenterAlertType" NOT NULL,
    "severity" "CommandCenterAlertSeverity" NOT NULL,
    "entity_type" VARCHAR(64) NOT NULL,
    "entity_id" VARCHAR(64) NOT NULL,
    "title" VARCHAR(512) NOT NULL,
    "description" TEXT NOT NULL,
    "action_label" VARCHAR(160),
    "action_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "lecipm_command_center_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lecipm_command_center_recommendations" (
    "id" TEXT NOT NULL,
    "snapshot_id" VARCHAR(36),
    "category" "CommandCenterRecommendationCategory" NOT NULL,
    "entity_type" VARCHAR(64) NOT NULL,
    "entity_id" VARCHAR(64) NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "reasoning_json" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acted_at" TIMESTAMP(3),
    "quick_action_key" VARCHAR(64),

    CONSTRAINT "lecipm_command_center_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lecipm_command_center_snapshots_owner_user_id_generated_at_idx" ON "lecipm_command_center_snapshots"("owner_user_id", "generated_at" DESC);

-- CreateIndex
CREATE INDEX "lecipm_command_center_alerts_type_severity_created_at_idx" ON "lecipm_command_center_alerts"("type", "severity", "created_at" DESC);

-- CreateIndex
CREATE INDEX "lecipm_command_center_alerts_entity_type_entity_id_idx" ON "lecipm_command_center_alerts"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "lecipm_command_center_alerts_snapshot_id_idx" ON "lecipm_command_center_alerts"("snapshot_id");

-- CreateIndex
CREATE INDEX "lecipm_command_center_recommendations_snapshot_id_score_idx" ON "lecipm_command_center_recommendations"("snapshot_id", "score" DESC);

-- CreateIndex
CREATE INDEX "lecipm_command_center_recommendations_entity_type_entity_id_idx" ON "lecipm_command_center_recommendations"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "lecipm_command_center_recommendations_acted_at_idx" ON "lecipm_command_center_recommendations"("acted_at");
