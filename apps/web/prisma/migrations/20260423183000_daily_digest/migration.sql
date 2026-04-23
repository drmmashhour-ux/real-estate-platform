-- Daily executive digest persistence (morning briefing aggregates + AI output).

CREATE TABLE "daily_digests" (
    "id" TEXT NOT NULL,
    "ownerType" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "summary" TEXT,
    "keyHighlights" JSONB,
    "risks" JSONB,
    "opportunities" JSONB,
    "suggestedActions" JSONB,
    "metrics" JSONB,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_digests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "daily_digests_ownerType_ownerId_date_idx" ON "daily_digests"("ownerType", "ownerId", "date");
