-- LECIPM PLATFORM — CRO + retargeting durable learning Phase 2 (additive)

CREATE TABLE "cro_learning_signals" (
    "id" TEXT NOT NULL,
    "source_growth_event_id" TEXT,
    "listingId" TEXT,
    "sessionId" TEXT,
    "userId" TEXT,
    "ctaId" TEXT,
    "ctaVariant" TEXT,
    "ctaPosition" TEXT,
    "trustBlock" BOOLEAN,
    "trustVariant" TEXT,
    "urgencyShown" BOOLEAN,
    "urgencyType" TEXT,
    "signalType" TEXT NOT NULL,
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "evidenceScore" DOUBLE PRECISION,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cro_learning_signals_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "cro_learning_signals_listingId_createdAt_idx" ON "cro_learning_signals"("listingId", "createdAt");
CREATE INDEX "cro_learning_signals_signalType_createdAt_idx" ON "cro_learning_signals"("signalType", "createdAt");
CREATE INDEX "cro_learning_signals_ctaVariant_createdAt_idx" ON "cro_learning_signals"("ctaVariant", "createdAt");

CREATE TABLE "retargeting_learning_signals" (
    "id" TEXT NOT NULL,
    "source_growth_event_id" TEXT,
    "segment" TEXT,
    "messageId" TEXT,
    "messageVariant" TEXT,
    "urgency" TEXT,
    "sessionId" TEXT,
    "userId" TEXT,
    "signalType" TEXT NOT NULL,
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "evidenceScore" DOUBLE PRECISION,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "retargeting_learning_signals_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "retargeting_learning_signals_source_growth_event_id_key" ON "retargeting_learning_signals"("source_growth_event_id");

CREATE INDEX "retargeting_learning_signals_segment_createdAt_idx" ON "retargeting_learning_signals"("segment", "createdAt");
CREATE INDEX "retargeting_learning_signals_messageId_createdAt_idx" ON "retargeting_learning_signals"("messageId", "createdAt");
CREATE INDEX "retargeting_learning_signals_signalType_createdAt_idx" ON "retargeting_learning_signals"("signalType", "createdAt");

CREATE TABLE "retargeting_performance_snapshots" (
    "id" TEXT NOT NULL,
    "segment" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "messageVariant" TEXT,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "bookings" INTEGER NOT NULL DEFAULT 0,
    "conversionRate" DOUBLE PRECISION,
    "qualityScore" DOUBLE PRECISION,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "retargeting_performance_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "retargeting_performance_snapshots_segment_messageId_key" ON "retargeting_performance_snapshots"("segment", "messageId");
CREATE INDEX "retargeting_performance_snapshots_segment_updatedAt_idx" ON "retargeting_performance_snapshots"("segment", "updatedAt");
