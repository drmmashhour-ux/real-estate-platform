-- CreateEnum
CREATE TYPE "ListingOptimizationRunStatus" AS ENUM ('queued', 'running', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "OptimizationRiskLevel" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "ListingOptimizationSuggestionStatus" AS ENUM ('suggested', 'approved', 'rejected', 'applied');

-- CreateEnum
CREATE TYPE "ListingAutopilotMode" AS ENUM ('off', 'assist', 'safe_autopilot', 'approval_required');

-- CreateTable
CREATE TABLE "listing_optimization_runs" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "status" "ListingOptimizationRunStatus" NOT NULL DEFAULT 'queued',
    "summary" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listing_optimization_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_optimization_suggestions" (
    "id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "field_type" TEXT NOT NULL,
    "current_value" TEXT,
    "proposed_value" TEXT,
    "reason" TEXT,
    "risk_level" "OptimizationRiskLevel" NOT NULL DEFAULT 'low',
    "confidence_score" INTEGER NOT NULL DEFAULT 0,
    "auto_apply_allowed" BOOLEAN NOT NULL DEFAULT false,
    "status" "ListingOptimizationSuggestionStatus" NOT NULL DEFAULT 'suggested',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listing_optimization_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_optimization_audit" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "suggestion_id" TEXT,
    "action" TEXT NOT NULL,
    "old_value" TEXT,
    "new_value" TEXT,
    "performed_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listing_optimization_audit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_autopilot_settings" (
    "id" TEXT NOT NULL,
    "owner_user_id" TEXT NOT NULL,
    "mode" "ListingAutopilotMode" NOT NULL DEFAULT 'assist',
    "auto_fix_titles" BOOLEAN NOT NULL DEFAULT true,
    "auto_fix_descriptions" BOOLEAN NOT NULL DEFAULT true,
    "auto_reorder_photos" BOOLEAN NOT NULL DEFAULT true,
    "auto_generate_content" BOOLEAN NOT NULL DEFAULT true,
    "allow_price_suggestions" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listing_autopilot_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "listing_optimization_runs_listing_id_idx" ON "listing_optimization_runs"("listing_id");

-- CreateIndex
CREATE INDEX "listing_optimization_runs_status_idx" ON "listing_optimization_runs"("status");

-- CreateIndex
CREATE INDEX "listing_optimization_suggestions_listing_id_idx" ON "listing_optimization_suggestions"("listing_id");

-- CreateIndex
CREATE INDEX "listing_optimization_suggestions_run_id_idx" ON "listing_optimization_suggestions"("run_id");

-- CreateIndex
CREATE INDEX "listing_optimization_suggestions_status_idx" ON "listing_optimization_suggestions"("status");

-- CreateIndex
CREATE INDEX "listing_optimization_audit_listing_id_idx" ON "listing_optimization_audit"("listing_id");

-- CreateIndex
CREATE INDEX "listing_optimization_audit_suggestion_id_idx" ON "listing_optimization_audit"("suggestion_id");

-- CreateIndex
CREATE UNIQUE INDEX "listing_autopilot_settings_owner_user_id_key" ON "listing_autopilot_settings"("owner_user_id");

-- AddForeignKey
ALTER TABLE "listing_optimization_runs" ADD CONSTRAINT "listing_optimization_runs_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_optimization_suggestions" ADD CONSTRAINT "listing_optimization_suggestions_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "listing_optimization_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_optimization_suggestions" ADD CONSTRAINT "listing_optimization_suggestions_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_optimization_audit" ADD CONSTRAINT "listing_optimization_audit_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_optimization_audit" ADD CONSTRAINT "listing_optimization_audit_suggestion_id_fkey" FOREIGN KEY ("suggestion_id") REFERENCES "listing_optimization_suggestions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_optimization_audit" ADD CONSTRAINT "listing_optimization_audit_performed_by_user_id_fkey" FOREIGN KEY ("performed_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_autopilot_settings" ADD CONSTRAINT "listing_autopilot_settings_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
