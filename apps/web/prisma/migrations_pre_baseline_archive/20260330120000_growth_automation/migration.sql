-- CreateEnum
CREATE TYPE "GrowthMarketingPlatform" AS ENUM ('INSTAGRAM', 'LINKEDIN', 'YOUTUBE', 'TIKTOK', 'BLOG', 'EMAIL');

-- CreateEnum
CREATE TYPE "GrowthMarketingChannelStatus" AS ENUM ('PENDING', 'CONNECTED', 'EXPIRED', 'REVOKED', 'ERROR');

-- CreateEnum
CREATE TYPE "GrowthContentItemStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'SCHEDULED', 'PUBLISHED', 'FAILED');

-- CreateTable
CREATE TABLE "marketing_channels" (
    "id" TEXT NOT NULL,
    "platform" "GrowthMarketingPlatform" NOT NULL,
    "external_account_id" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "oauth_access_token_encrypted" TEXT NOT NULL,
    "oauth_refresh_token_encrypted" TEXT,
    "scopes" JSONB NOT NULL DEFAULT '[]',
    "token_expires_at" TIMESTAMPTZ(6),
    "status" "GrowthMarketingChannelStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "marketing_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_items" (
    "id" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "platform" "GrowthMarketingPlatform" NOT NULL,
    "status" "GrowthContentItemStatus" NOT NULL DEFAULT 'DRAFT',
    "draft_payload" JSONB NOT NULL,
    "publish_payload" JSONB,
    "scheduled_for" TIMESTAMPTZ(6),
    "published_at" TIMESTAMPTZ(6),
    "external_post_id" TEXT,
    "marketing_channel_id" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "publish_fingerprint" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "content_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_performance_metrics" (
    "id" TEXT NOT NULL,
    "content_item_id" TEXT NOT NULL,
    "platform" "GrowthMarketingPlatform" NOT NULL,
    "metric_date" DATE NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "impressions" INTEGER,
    "likes" INTEGER,
    "comments" INTEGER,
    "shares" INTEGER,
    "clicks" INTEGER,
    "conversions" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_performance_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uq_marketing_channel_platform_ext" ON "marketing_channels"("platform", "external_account_id");

-- CreateIndex
CREATE INDEX "idx_marketing_channels_status" ON "marketing_channels"("status");

-- CreateIndex
CREATE INDEX "idx_growth_content_items_status" ON "content_items"("status");

-- CreateIndex
CREATE INDEX "idx_growth_content_items_scheduled" ON "content_items"("scheduled_for");

-- CreateIndex
CREATE UNIQUE INDEX "uq_growth_perf_item_date" ON "content_performance_metrics"("content_item_id", "metric_date");

-- AddForeignKey
ALTER TABLE "content_items" ADD CONSTRAINT "content_items_marketing_channel_id_fkey" FOREIGN KEY ("marketing_channel_id") REFERENCES "marketing_channels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_performance_metrics" ADD CONSTRAINT "content_performance_metrics_content_item_id_fkey" FOREIGN KEY ("content_item_id") REFERENCES "content_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
