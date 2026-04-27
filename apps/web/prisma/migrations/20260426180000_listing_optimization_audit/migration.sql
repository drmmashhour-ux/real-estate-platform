-- CreateTable: combined listing quality + pricing suggestion audit
CREATE TABLE "ListingOptimization" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "suggestions" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "applied" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ListingOptimization_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ListingOptimization_listingId_idx" ON "ListingOptimization"("listingId");
CREATE INDEX "ListingOptimization_createdAt_idx" ON "ListingOptimization"("createdAt");
