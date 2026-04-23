-- Portfolio Autopilot Advisor: reviews, recommendations, performance snapshots.

CREATE TABLE "PortfolioAutopilotReview" (
    "id" TEXT NOT NULL,
    "portfolioId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "reviewType" TEXT NOT NULL,
    "overallHealthScore" DOUBLE PRECISION,
    "concentrationRisk" DOUBLE PRECISION,
    "cashflowStrength" DOUBLE PRECISION,
    "growthStrength" DOUBLE PRECISION,
    "riskScore" DOUBLE PRECISION,
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortfolioAutopilotReview_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PortfolioAutopilotReview_portfolioId_idx" ON "PortfolioAutopilotReview"("portfolioId");

CREATE TABLE "PortfolioAutopilotRecommendation" (
    "id" TEXT NOT NULL,
    "portfolioAutopilotReviewId" TEXT NOT NULL,
    "recommendationType" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "propertyId" TEXT,
    "neighborhoodKey" TEXT,
    "rationale" JSONB,
    "aiSummary" TEXT,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT true,
    "accepted" BOOLEAN NOT NULL DEFAULT false,
    "dismissed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortfolioAutopilotRecommendation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PortfolioAutopilotRecommendation_portfolioAutopilotReviewId_idx" ON "PortfolioAutopilotRecommendation"("portfolioAutopilotReviewId");

CREATE TABLE "PortfolioPerformanceSnapshot" (
    "id" TEXT NOT NULL,
    "portfolioId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "totalValueCents" INTEGER,
    "totalCashflowCents" INTEGER,
    "avgCapRate" DOUBLE PRECISION,
    "avgROI" DOUBLE PRECISION,
    "avgDSCR" DOUBLE PRECISION,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PortfolioPerformanceSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PortfolioPerformanceSnapshot_portfolioId_date_idx" ON "PortfolioPerformanceSnapshot"("portfolioId", "date");
