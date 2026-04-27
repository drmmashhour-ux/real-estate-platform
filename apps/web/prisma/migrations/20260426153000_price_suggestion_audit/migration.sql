-- CreateTable: AI/rules-engine price proposal audit (no FK — listing may be CRM or bnhub id)
CREATE TABLE "PriceSuggestion" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "suggestedPriceCents" INTEGER NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "applied" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PriceSuggestion_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PriceSuggestion_listingId_idx" ON "PriceSuggestion"("listingId");
CREATE INDEX "PriceSuggestion_createdAt_idx" ON "PriceSuggestion"("createdAt");
