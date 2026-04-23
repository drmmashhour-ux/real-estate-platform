-- Strategic cockpit: persisted executive KPI rollups + AI summary payload.

CREATE TABLE "executive_snapshots" (
    "id" TEXT NOT NULL,
    "ownerType" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "snapshotDate" TIMESTAMP(3) NOT NULL,
    "platformMetrics" JSONB,
    "complianceMetrics" JSONB,
    "financialMetrics" JSONB,
    "investorMetrics" JSONB,
    "marketMetrics" JSONB,
    "aiMetrics" JSONB,
    "overallHealthScore" DOUBLE PRECISION,
    "riskLevel" TEXT,
    "summary" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "executive_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ExecutiveSnapshot_ownerType_ownerId_snapshotDate_idx" ON "executive_snapshots"("ownerType", "ownerId", "snapshotDate");
