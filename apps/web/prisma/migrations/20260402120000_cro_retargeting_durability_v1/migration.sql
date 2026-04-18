-- LECIPM — CRO + retargeting durability V1 (additive columns + low-conversion snapshot tables)

ALTER TABLE "cro_learning_signals" ADD COLUMN IF NOT EXISTS "growth_event_id" TEXT;
ALTER TABLE "cro_learning_signals" ADD COLUMN IF NOT EXISTS "evidenceQuality" TEXT;
CREATE INDEX IF NOT EXISTS "cro_learning_signals_growth_event_id_idx" ON "cro_learning_signals"("growth_event_id");

ALTER TABLE "retargeting_learning_signals" ADD COLUMN IF NOT EXISTS "growth_event_id" TEXT;
ALTER TABLE "retargeting_learning_signals" ADD COLUMN IF NOT EXISTS "evidenceQuality" TEXT;
CREATE INDEX IF NOT EXISTS "retargeting_learning_signals_growth_event_id_idx" ON "retargeting_learning_signals"("growth_event_id");

ALTER TABLE "retargeting_performance_snapshots" ADD COLUMN IF NOT EXISTS "evidenceScore" DOUBLE PRECISION;
ALTER TABLE "retargeting_performance_snapshots" ADD COLUMN IF NOT EXISTS "evidenceQuality" TEXT;
CREATE INDEX IF NOT EXISTS "retargeting_performance_snapshots_messageId_updatedAt_idx" ON "retargeting_performance_snapshots"("messageId", "updatedAt");

CREATE TABLE IF NOT EXISTS "cro_low_conversion_snapshots" (
    "id" TEXT NOT NULL,
    "groupKey" TEXT NOT NULL,
    "listingId" TEXT,
    "ctaVariant" TEXT,
    "trustVariant" TEXT,
    "urgencyType" TEXT,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "leads" INTEGER NOT NULL DEFAULT 0,
    "bookings" INTEGER NOT NULL DEFAULT 0,
    "conversionRate" DOUBLE PRECISION,
    "evidenceScore" DOUBLE PRECISION NOT NULL,
    "evidenceQuality" TEXT NOT NULL,
    "reasons" JSONB,
    "warnings" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cro_low_conversion_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "cro_low_conversion_snapshots_groupKey_key" ON "cro_low_conversion_snapshots"("groupKey");
CREATE INDEX IF NOT EXISTS "cro_low_conversion_snapshots_listingId_updatedAt_idx" ON "cro_low_conversion_snapshots"("listingId", "updatedAt");
CREATE INDEX IF NOT EXISTS "cro_low_conversion_snapshots_ctaVariant_updatedAt_idx" ON "cro_low_conversion_snapshots"("ctaVariant", "updatedAt");

CREATE TABLE IF NOT EXISTS "retargeting_low_conversion_snapshots" (
    "id" TEXT NOT NULL,
    "groupKey" TEXT NOT NULL,
    "segment" TEXT,
    "messageId" TEXT,
    "messageVariant" TEXT,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "bookings" INTEGER NOT NULL DEFAULT 0,
    "conversionRate" DOUBLE PRECISION,
    "evidenceScore" DOUBLE PRECISION NOT NULL,
    "evidenceQuality" TEXT NOT NULL,
    "reasons" JSONB,
    "warnings" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "retargeting_low_conversion_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "retargeting_low_conversion_snapshots_groupKey_key" ON "retargeting_low_conversion_snapshots"("groupKey");
CREATE INDEX IF NOT EXISTS "retargeting_low_conversion_snapshots_segment_updatedAt_idx" ON "retargeting_low_conversion_snapshots"("segment", "updatedAt");
CREATE INDEX IF NOT EXISTS "retargeting_low_conversion_snapshots_messageId_updatedAt_idx" ON "retargeting_low_conversion_snapshots"("messageId", "updatedAt");
