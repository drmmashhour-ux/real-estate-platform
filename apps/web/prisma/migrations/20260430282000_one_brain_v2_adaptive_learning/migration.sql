-- LECIPM PLATFORM — One Brain V2 adaptive learning (additive)

CREATE TABLE "brain_source_weight_snapshots" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "sampleCount" INTEGER NOT NULL DEFAULT 0,
    "positiveCount" INTEGER NOT NULL DEFAULT 0,
    "negativeCount" INTEGER NOT NULL DEFAULT 0,
    "neutralCount" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brain_source_weight_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "brain_source_weight_snapshots_source_key" ON "brain_source_weight_snapshots"("source");
CREATE INDEX "brain_source_weight_snapshots_updatedAt_idx" ON "brain_source_weight_snapshots"("updatedAt");

CREATE TABLE "brain_decision_outcomes" (
    "id" TEXT NOT NULL,
    "decisionId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "actionType" TEXT NOT NULL,
    "outcomeType" TEXT NOT NULL,
    "outcomeScore" DOUBLE PRECISION NOT NULL,
    "observedMetrics" JSONB,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "brain_decision_outcomes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "brain_decision_outcomes_decisionId_createdAt_idx" ON "brain_decision_outcomes"("decisionId", "createdAt");
CREATE INDEX "brain_decision_outcomes_source_createdAt_idx" ON "brain_decision_outcomes"("source", "createdAt");
CREATE INDEX "brain_decision_outcomes_entityType_entityId_idx" ON "brain_decision_outcomes"("entityType", "entityId");

CREATE TABLE "brain_learning_runs" (
    "id" TEXT NOT NULL,
    "sourceCount" INTEGER NOT NULL DEFAULT 0,
    "decisionCount" INTEGER NOT NULL DEFAULT 0,
    "notes" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "brain_learning_runs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "brain_learning_runs_createdAt_idx" ON "brain_learning_runs"("createdAt");
