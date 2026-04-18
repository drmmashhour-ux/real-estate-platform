-- Marketplace Intelligence Engine V6 — additive audit tables (no FK to bnhub_listings; string listing_id only)

CREATE TABLE "listing_marketplace_quality_snapshots_v6" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "factors" JSONB NOT NULL,
    "warnings" JSONB NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listing_marketplace_quality_snapshots_v6_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "listing_marketplace_trust_snapshots_v6" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "factors" JSONB NOT NULL,
    "riskFlags" JSONB NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listing_marketplace_trust_snapshots_v6_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "listing_marketplace_fraud_signals_v6" (
    "id" TEXT NOT NULL,
    "listingId" TEXT,
    "userId" TEXT,
    "signalType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "evidence" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listing_marketplace_fraud_signals_v6_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "listing_marketplace_ranking_snapshots_v6" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "qualityScore" DOUBLE PRECISION NOT NULL,
    "trustScore" DOUBLE PRECISION NOT NULL,
    "conversionScore" DOUBLE PRECISION NOT NULL,
    "priceFitScore" DOUBLE PRECISION NOT NULL,
    "freshnessScore" DOUBLE PRECISION NOT NULL,
    "reasons" JSONB NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listing_marketplace_ranking_snapshots_v6_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "listing_marketplace_pricing_recommendations_v6" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "currentPrice" DOUBLE PRECISION NOT NULL,
    "recommendedPrice" DOUBLE PRECISION NOT NULL,
    "adjustmentPercent" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "evidence" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listing_marketplace_pricing_recommendations_v6_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "marketplace_decision_logs_v6" (
    "id" TEXT NOT NULL,
    "listingId" TEXT,
    "userId" TEXT,
    "decisionType" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "priority" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "evidence" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketplace_decision_logs_v6_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "listing_marketplace_quality_snapshots_v6_listingId_createdAt_idx" ON "listing_marketplace_quality_snapshots_v6"("listingId", "createdAt");

CREATE INDEX "listing_marketplace_quality_snapshots_v6_createdAt_idx" ON "listing_marketplace_quality_snapshots_v6"("createdAt");

CREATE INDEX "listing_marketplace_trust_snapshots_v6_listingId_createdAt_idx" ON "listing_marketplace_trust_snapshots_v6"("listingId", "createdAt");

CREATE INDEX "listing_marketplace_trust_snapshots_v6_createdAt_idx" ON "listing_marketplace_trust_snapshots_v6"("createdAt");

CREATE INDEX "listing_marketplace_fraud_signals_v6_listingId_createdAt_idx" ON "listing_marketplace_fraud_signals_v6"("listingId", "createdAt");

CREATE INDEX "listing_marketplace_fraud_signals_v6_userId_createdAt_idx" ON "listing_marketplace_fraud_signals_v6"("userId", "createdAt");

CREATE INDEX "listing_marketplace_fraud_signals_v6_signalType_severity_idx" ON "listing_marketplace_fraud_signals_v6"("signalType", "severity");

CREATE INDEX "listing_marketplace_fraud_signals_v6_status_idx" ON "listing_marketplace_fraud_signals_v6"("status");

CREATE INDEX "listing_marketplace_ranking_snapshots_v6_listingId_createdAt_idx" ON "listing_marketplace_ranking_snapshots_v6"("listingId", "createdAt");

CREATE INDEX "listing_marketplace_ranking_snapshots_v6_createdAt_idx" ON "listing_marketplace_ranking_snapshots_v6"("createdAt");

CREATE INDEX "listing_marketplace_pricing_recommendations_v6_listingId_createdAt_idx" ON "listing_marketplace_pricing_recommendations_v6"("listingId", "createdAt");

CREATE INDEX "listing_marketplace_pricing_recommendations_v6_status_idx" ON "listing_marketplace_pricing_recommendations_v6"("status");

CREATE INDEX "marketplace_decision_logs_v6_listingId_createdAt_idx" ON "marketplace_decision_logs_v6"("listingId", "createdAt");

CREATE INDEX "marketplace_decision_logs_v6_userId_createdAt_idx" ON "marketplace_decision_logs_v6"("userId", "createdAt");

CREATE INDEX "marketplace_decision_logs_v6_decisionType_idx" ON "marketplace_decision_logs_v6"("decisionType");
