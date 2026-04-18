-- LECIPM Operator + Assistant Layer v1 — audit tables (additive)

CREATE TABLE "operator_recommendation_logs" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "targetId" TEXT,
    "targetLabel" TEXT,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "confidenceLabel" TEXT NOT NULL,
    "evidenceScore" DOUBLE PRECISION,
    "evidenceQuality" TEXT,
    "expectedImpact" TEXT,
    "operatorAction" TEXT,
    "blockers" JSONB,
    "warnings" JSONB,
    "metrics" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "operator_recommendation_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "operator_recommendation_approvals" (
    "id" TEXT NOT NULL,
    "recommendationId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "reviewerUserId" TEXT,
    "reviewerNote" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "operator_recommendation_approvals_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "operator_conflict_snapshots" (
    "id" TEXT NOT NULL,
    "targetId" TEXT,
    "actionTypes" JSONB NOT NULL,
    "sources" JSONB NOT NULL,
    "severity" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "operator_conflict_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "operator_recommendation_logs_source_createdAt_idx" ON "operator_recommendation_logs"("source", "createdAt");
CREATE INDEX "operator_recommendation_logs_targetId_createdAt_idx" ON "operator_recommendation_logs"("targetId", "createdAt");
CREATE INDEX "operator_recommendation_logs_actionType_createdAt_idx" ON "operator_recommendation_logs"("actionType", "createdAt");

CREATE INDEX "operator_recommendation_approvals_recommendationId_status_idx" ON "operator_recommendation_approvals"("recommendationId", "status");
CREATE INDEX "operator_recommendation_approvals_reviewerUserId_createdAt_idx" ON "operator_recommendation_approvals"("reviewerUserId", "createdAt");
CREATE INDEX "operator_recommendation_approvals_createdAt_idx" ON "operator_recommendation_approvals"("createdAt");

CREATE INDEX "operator_conflict_snapshots_targetId_createdAt_idx" ON "operator_conflict_snapshots"("targetId", "createdAt");
CREATE INDEX "operator_conflict_snapshots_severity_createdAt_idx" ON "operator_conflict_snapshots"("severity", "createdAt");

ALTER TABLE "operator_recommendation_approvals" ADD CONSTRAINT "operator_recommendation_approvals_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "operator_recommendation_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
