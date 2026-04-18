-- Profit Engine V2 — durable snapshots, trends, learning (additive)

CREATE TABLE "campaign_profit_snapshots" (
    "id" TEXT NOT NULL,
    "campaignKey" TEXT NOT NULL,
    "impressions" INTEGER NOT NULL,
    "clicks" INTEGER NOT NULL,
    "leads" INTEGER NOT NULL,
    "bookings" INTEGER NOT NULL,
    "spend" DOUBLE PRECISION NOT NULL,
    "cpl" DOUBLE PRECISION,
    "ltvEstimate" DOUBLE PRECISION,
    "ltvToCplRatio" DOUBLE PRECISION,
    "profitPerLead" DOUBLE PRECISION,
    "status" TEXT NOT NULL,
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "evidenceQuality" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_profit_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "campaign_profit_snapshots_campaignKey_createdAt_idx" ON "campaign_profit_snapshots"("campaignKey", "createdAt");

CREATE TABLE "campaign_profit_trends" (
    "id" TEXT NOT NULL,
    "campaignKey" TEXT NOT NULL,
    "day" TIMESTAMP(3) NOT NULL,
    "profitPerLead" DOUBLE PRECISION,
    "ltvToCplRatio" DOUBLE PRECISION,
    "spend" DOUBLE PRECISION NOT NULL,
    "leads" INTEGER NOT NULL,
    "bookings" INTEGER NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_profit_trends_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "campaign_profit_trends_campaignKey_day_key" ON "campaign_profit_trends"("campaignKey", "day");

CREATE TABLE "campaign_profit_learning" (
    "id" TEXT NOT NULL,
    "campaignKey" TEXT NOT NULL,
    "signalType" TEXT NOT NULL,
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "evidenceScore" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_profit_learning_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "campaign_profit_learning_campaignKey_createdAt_idx" ON "campaign_profit_learning"("campaignKey", "createdAt");
