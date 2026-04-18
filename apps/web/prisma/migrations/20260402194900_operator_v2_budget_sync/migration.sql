-- LECIPM Operator V2 — external sync logs, provider links, budget snapshots (additive)

CREATE TABLE "operator_external_sync_logs" (
    "id" TEXT NOT NULL,
    "recommendationId" TEXT,
    "actionType" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "targetId" TEXT,
    "externalTargetId" TEXT,
    "dryRun" BOOLEAN NOT NULL DEFAULT true,
    "success" BOOLEAN NOT NULL,
    "message" TEXT NOT NULL,
    "requestPayload" JSONB,
    "responsePayload" JSONB,
    "warnings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "operator_external_sync_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "operator_campaign_provider_links" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "externalCampaignId" TEXT NOT NULL,
    "status" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "operator_campaign_provider_links_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "operator_campaign_provider_links_campaignId_provider_key" ON "operator_campaign_provider_links"("campaignId", "provider");

CREATE INDEX "operator_campaign_provider_links_provider_externalCampaignId_idx" ON "operator_campaign_provider_links"("provider", "externalCampaignId");

CREATE TABLE "operator_budget_execution_snapshots" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "currentBudget" DOUBLE PRECISION NOT NULL,
    "proposedBudget" DOUBLE PRECISION NOT NULL,
    "cappedBudget" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'CAD',
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "profitStatus" TEXT,
    "approvalStatus" TEXT NOT NULL,
    "executionMode" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "operator_budget_execution_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "operator_external_sync_logs_provider_createdAt_idx" ON "operator_external_sync_logs"("provider", "createdAt");
CREATE INDEX "operator_external_sync_logs_recommendationId_createdAt_idx" ON "operator_external_sync_logs"("recommendationId", "createdAt");
CREATE INDEX "operator_external_sync_logs_targetId_createdAt_idx" ON "operator_external_sync_logs"("targetId", "createdAt");

CREATE INDEX "operator_budget_execution_snapshots_campaignId_createdAt_idx" ON "operator_budget_execution_snapshots"("campaignId", "createdAt");
CREATE INDEX "operator_budget_execution_snapshots_provider_createdAt_idx" ON "operator_budget_execution_snapshots"("provider", "createdAt");
