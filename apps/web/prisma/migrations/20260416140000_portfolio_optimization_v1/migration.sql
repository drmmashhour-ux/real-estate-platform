-- Portfolio optimization V1 — audit tables only (additive)

CREATE TABLE "portfolio_optimization_runs" (
    "id" TEXT NOT NULL,
    "totalBudget" DOUBLE PRECISION NOT NULL,
    "reallocatableBudget" DOUBLE PRECISION NOT NULL,
    "notes" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portfolio_optimization_runs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "portfolio_optimization_runs_createdAt_idx" ON "portfolio_optimization_runs"("createdAt");

CREATE TABLE "portfolio_campaign_score_snapshots" (
    "id" TEXT NOT NULL,
    "runId" TEXT,
    "campaignKey" TEXT NOT NULL,
    "portfolioScore" DOUBLE PRECISION NOT NULL,
    "qualityLabel" TEXT NOT NULL,
    "reasons" JSONB,
    "warnings" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portfolio_campaign_score_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "portfolio_campaign_score_snapshots_campaignKey_createdAt_idx" ON "portfolio_campaign_score_snapshots"("campaignKey", "createdAt");
CREATE INDEX "portfolio_campaign_score_snapshots_runId_createdAt_idx" ON "portfolio_campaign_score_snapshots"("runId", "createdAt");

CREATE TABLE "budget_reallocation_recommendation_logs" (
    "id" TEXT NOT NULL,
    "runId" TEXT,
    "fromCampaignKey" TEXT,
    "toCampaignKey" TEXT,
    "fromAmount" DOUBLE PRECISION,
    "toAmount" DOUBLE PRECISION,
    "amount" DOUBLE PRECISION NOT NULL,
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "safeguards" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "budget_reallocation_recommendation_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "budget_reallocation_recommendation_logs_runId_createdAt_idx" ON "budget_reallocation_recommendation_logs"("runId", "createdAt");
CREATE INDEX "budget_reallocation_recommendation_logs_fromCampaignKey_createdAt_idx" ON "budget_reallocation_recommendation_logs"("fromCampaignKey", "createdAt");
CREATE INDEX "budget_reallocation_recommendation_logs_toCampaignKey_createdAt_idx" ON "budget_reallocation_recommendation_logs"("toCampaignKey", "createdAt");
