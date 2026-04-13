-- CreateEnum
CREATE TYPE "ListingQualityLevel" AS ENUM ('poor', 'needs_improvement', 'good', 'excellent');

-- CreateEnum
CREATE TYPE "ListingHealthStatus" AS ENUM ('needs_attention', 'improving', 'healthy', 'top_performer');

-- CreateEnum
CREATE TYPE "ListingHealthActionPriority" AS ENUM ('high', 'medium', 'low');

-- CreateTable
CREATE TABLE "listing_quality_scores" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "quality_score" INTEGER NOT NULL DEFAULT 0,
    "level" "ListingQualityLevel" NOT NULL DEFAULT 'needs_improvement',
    "content_score" INTEGER NOT NULL DEFAULT 0,
    "pricing_score" INTEGER NOT NULL DEFAULT 0,
    "performance_score" INTEGER NOT NULL DEFAULT 0,
    "behavior_score" INTEGER NOT NULL DEFAULT 0,
    "trust_score" INTEGER NOT NULL DEFAULT 0,
    "health_status" "ListingHealthStatus" NOT NULL DEFAULT 'needs_attention',
    "reasons_json" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listing_quality_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_health_actions" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "priority" "ListingHealthActionPriority" NOT NULL DEFAULT 'medium',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listing_health_actions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "listing_quality_scores_listing_id_key" ON "listing_quality_scores"("listing_id");

-- CreateIndex
CREATE INDEX "listing_quality_scores_level_idx" ON "listing_quality_scores"("level");

-- CreateIndex
CREATE INDEX "listing_health_actions_listing_id_idx" ON "listing_health_actions"("listing_id");

-- CreateIndex
CREATE INDEX "listing_health_actions_priority_idx" ON "listing_health_actions"("priority");

-- CreateIndex
CREATE INDEX "listing_quality_scores_health_status_idx" ON "listing_quality_scores"("health_status");

-- AddForeignKey
ALTER TABLE "listing_quality_scores" ADD CONSTRAINT "listing_quality_scores_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_health_actions" ADD CONSTRAINT "listing_health_actions_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
