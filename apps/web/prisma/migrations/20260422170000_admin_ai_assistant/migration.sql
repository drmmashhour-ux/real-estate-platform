-- CreateEnum
CREATE TYPE "AdminAiInsightType" AS ENUM (
  'daily_summary',
  'alert',
  'recommendation',
  'listing_diagnosis',
  'revenue_summary',
  'user_intent_summary'
);

-- CreateEnum
CREATE TYPE "AdminAiInsightPriority" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateEnum
CREATE TYPE "AdminAiEntityType" AS ENUM (
  'listing',
  'user',
  'revenue',
  'document_request',
  'payment',
  'support',
  'funnel'
);

-- CreateEnum
CREATE TYPE "AdminAiRunStatus" AS ENUM ('queued', 'running', 'completed', 'failed');

-- CreateTable
CREATE TABLE "admin_ai_insights" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "type" "AdminAiInsightType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "priority" "AdminAiInsightPriority" NOT NULL DEFAULT 'medium',
    "entityType" "AdminAiEntityType",
    "entityId" TEXT,
    "metadata_json" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_ai_insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_ai_runs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "run_type" TEXT NOT NULL,
    "status" "AdminAiRunStatus" NOT NULL DEFAULT 'queued',
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "summary" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_ai_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "admin_ai_insights_type_idx" ON "admin_ai_insights"("type");

-- CreateIndex
CREATE INDEX "admin_ai_insights_priority_idx" ON "admin_ai_insights"("priority");

-- CreateIndex
CREATE INDEX "admin_ai_insights_entityType_idx" ON "admin_ai_insights"("entityType");

-- CreateIndex
CREATE INDEX "admin_ai_insights_created_at_idx" ON "admin_ai_insights"("created_at");

-- CreateIndex
CREATE INDEX "admin_ai_runs_run_type_idx" ON "admin_ai_runs"("run_type");

-- CreateIndex
CREATE INDEX "admin_ai_runs_status_idx" ON "admin_ai_runs"("status");

-- CreateIndex
CREATE INDEX "admin_ai_runs_created_at_idx" ON "admin_ai_runs"("created_at");
