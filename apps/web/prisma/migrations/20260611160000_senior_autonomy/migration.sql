-- CreateEnum
CREATE TYPE "SeniorAutonomyMode" AS ENUM ('OFF', 'ASSIST', 'SAFE_AUTOPILOT', 'FULL_AUTOPILOT_APPROVAL');

-- CreateTable
CREATE TABLE "senior_autonomy_settings" (
    "id" VARCHAR(48) NOT NULL,
    "mode" "SeniorAutonomyMode" NOT NULL DEFAULT 'OFF',
    "paused" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "senior_autonomy_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "senior_autonomous_action_logs" (
    "id" TEXT NOT NULL,
    "action_type" VARCHAR(48) NOT NULL,
    "payload" JSONB NOT NULL,
    "risk_level" VARCHAR(16) NOT NULL,
    "status" VARCHAR(24) NOT NULL,
    "reason" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "impact_conversion_pct" DOUBLE PRECISION,
    "impact_revenue_pct" DOUBLE PRECISION,
    "reversal_payload" JSONB,
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by_user_id" VARCHAR(36),
    "rejection_reason" TEXT,
    "executed_at" TIMESTAMP(3),
    "executed_result_json" JSONB,
    "learning_outcome_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "senior_autonomous_action_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "senior_autonomous_action_logs_status_created_at_idx" ON "senior_autonomous_action_logs"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "senior_autonomous_action_logs_risk_level_status_idx" ON "senior_autonomous_action_logs"("risk_level", "status");

-- Seed singleton
INSERT INTO "senior_autonomy_settings" ("id", "mode", "paused", "updated_at")
VALUES ('senior_autonomy_global', 'OFF', false, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
