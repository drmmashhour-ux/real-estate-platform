-- BNHub Global AI Distribution & Marketing Engine

CREATE TYPE "BnhubMarketingCampaignObjective" AS ENUM ('AWARENESS', 'TRAFFIC', 'LEAD_GENERATION', 'BOOKING_CONVERSION', 'BRAND_BUILDING');
CREATE TYPE "BnhubMarketingCampaignStatus" AS ENUM ('DRAFT', 'READY', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED', 'FAILED');
CREATE TYPE "BnhubMarketingBudgetMode" AS ENUM ('NONE', 'INTERNAL_ONLY', 'ESTIMATED', 'PAID_EXTERNAL');
CREATE TYPE "BnhubMarketingAssetType" AS ENUM ('HEADLINE', 'CAPTION', 'LONG_DESCRIPTION', 'SEO_TITLE', 'SEO_META', 'EMAIL_COPY', 'SOCIAL_POST', 'AD_COPY', 'BROCHURE_TEXT', 'BLOG_FEED_CARD');
CREATE TYPE "BnhubMarketingTone" AS ENUM ('LUXURY', 'PROFESSIONAL', 'FRIENDLY', 'DIRECT', 'PREMIUM', 'INVESTOR');
CREATE TYPE "BnhubDistributionChannelType" AS ENUM ('INTERNAL', 'EXTERNAL', 'EXPORT');
CREATE TYPE "BnhubCampaignDistributionStatus" AS ENUM ('DRAFT', 'QUEUED', 'SCHEDULED', 'PUBLISHED', 'FAILED', 'CANCELLED');
CREATE TYPE "BnhubMarketingEventType" AS ENUM ('GENERATED', 'EDITED', 'SCHEDULED', 'PUBLISHED', 'FAILED', 'CLICKED', 'LEAD', 'BOOKING', 'RECOMMENDATION_APPLIED');
CREATE TYPE "BnhubMarketingEventSource" AS ENUM ('SYSTEM', 'AI', 'ADMIN', 'HOST');
CREATE TYPE "BnhubMarketingRecommendationType" AS ENUM ('CHANNEL', 'TIMING', 'CREATIVE', 'PRICING', 'PHOTO_UPGRADE', 'DESCRIPTION_UPGRADE', 'HOMEPAGE_BOOST');
CREATE TYPE "BnhubMarketingRecommendationPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "BnhubMarketingRecommendationStatus" AS ENUM ('OPEN', 'APPLIED', 'DISMISSED');
CREATE TYPE "BnhubEmailCampaignQueueStatus" AS ENUM ('DRAFT', 'QUEUED', 'SENT', 'CANCELLED');

CREATE TABLE "bnhub_marketing_campaigns" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "host_user_id" TEXT NOT NULL,
    "created_by" TEXT,
    "campaign_name" TEXT NOT NULL,
    "objective" "BnhubMarketingCampaignObjective" NOT NULL,
    "status" "BnhubMarketingCampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "target_region" TEXT,
    "target_country" TEXT,
    "target_city" TEXT,
    "target_audience_json" JSONB,
    "budget_mode" "BnhubMarketingBudgetMode" NOT NULL DEFAULT 'NONE',
    "estimated_budget_cents" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'CAD',
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "notes" TEXT,
    "ai_strategy_summary" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bnhub_marketing_campaigns_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bnhub_marketing_assets" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "asset_type" "BnhubMarketingAssetType" NOT NULL,
    "language_code" TEXT NOT NULL DEFAULT 'en',
    "tone" "BnhubMarketingTone" NOT NULL DEFAULT 'PROFESSIONAL',
    "title" TEXT,
    "content" TEXT NOT NULL,
    "metadata_json" JSONB,
    "ai_generated" BOOLEAN NOT NULL DEFAULT true,
    "human_edited" BOOLEAN NOT NULL DEFAULT false,
    "version_no" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bnhub_marketing_assets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bnhub_distribution_channels" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "channel_type" "BnhubDistributionChannelType" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "config_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bnhub_distribution_channels_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bnhub_campaign_distributions" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "distribution_status" "BnhubCampaignDistributionStatus" NOT NULL DEFAULT 'DRAFT',
    "scheduled_at" TIMESTAMP(3),
    "published_at" TIMESTAMP(3),
    "payload_json" JSONB,
    "external_ref" TEXT,
    "result_summary" TEXT,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "leads" INTEGER NOT NULL DEFAULT 0,
    "saves" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "bookings" INTEGER NOT NULL DEFAULT 0,
    "spend_cents" INTEGER NOT NULL DEFAULT 0,
    "revenue_attributed_cents" INTEGER NOT NULL DEFAULT 0,
    "roi_estimate" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bnhub_campaign_distributions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bnhub_listing_marketing_profiles" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "listing_quality_score" INTEGER NOT NULL DEFAULT 0,
    "photo_quality_score" INTEGER NOT NULL DEFAULT 0,
    "description_quality_score" INTEGER NOT NULL DEFAULT 0,
    "trust_score" INTEGER NOT NULL DEFAULT 0,
    "pricing_score" INTEGER NOT NULL DEFAULT 0,
    "market_fit_score" INTEGER NOT NULL DEFAULT 0,
    "readiness_score" INTEGER NOT NULL DEFAULT 0,
    "recommended_angle" TEXT,
    "recommended_languages_json" JSONB,
    "recommended_channels_json" JSONB,
    "missing_items_json" JSONB,
    "ai_summary" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bnhub_listing_marketing_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bnhub_marketing_events" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT,
    "distribution_id" TEXT,
    "event_type" "BnhubMarketingEventType" NOT NULL,
    "event_source" "BnhubMarketingEventSource" NOT NULL,
    "event_data_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bnhub_marketing_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bnhub_marketing_recommendations" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "campaign_id" TEXT,
    "recommendation_type" "BnhubMarketingRecommendationType" NOT NULL,
    "priority" "BnhubMarketingRecommendationPriority" NOT NULL DEFAULT 'MEDIUM',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "action_label" TEXT NOT NULL,
    "action_payload_json" JSONB,
    "status" "BnhubMarketingRecommendationStatus" NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bnhub_marketing_recommendations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bnhub_email_campaign_queue" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body_html" TEXT NOT NULL,
    "status" "BnhubEmailCampaignQueueStatus" NOT NULL DEFAULT 'DRAFT',
    "scheduled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bnhub_email_campaign_queue_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "bnhub_distribution_channels_code_key" ON "bnhub_distribution_channels"("code");
CREATE UNIQUE INDEX "bnhub_listing_marketing_profiles_listing_id_key" ON "bnhub_listing_marketing_profiles"("listing_id");

CREATE INDEX "bnhub_marketing_campaigns_listing_id_idx" ON "bnhub_marketing_campaigns"("listing_id");
CREATE INDEX "bnhub_marketing_campaigns_host_user_id_idx" ON "bnhub_marketing_campaigns"("host_user_id");
CREATE INDEX "bnhub_marketing_campaigns_status_idx" ON "bnhub_marketing_campaigns"("status");
CREATE INDEX "bnhub_marketing_campaigns_created_at_idx" ON "bnhub_marketing_campaigns"("created_at");

CREATE INDEX "bnhub_marketing_assets_campaign_id_idx" ON "bnhub_marketing_assets"("campaign_id");
CREATE INDEX "bnhub_marketing_assets_listing_id_idx" ON "bnhub_marketing_assets"("listing_id");
CREATE INDEX "bnhub_marketing_assets_asset_type_idx" ON "bnhub_marketing_assets"("asset_type");
CREATE INDEX "bnhub_marketing_assets_language_code_idx" ON "bnhub_marketing_assets"("language_code");

CREATE INDEX "bnhub_distribution_channels_channel_type_idx" ON "bnhub_distribution_channels"("channel_type");
CREATE INDEX "bnhub_distribution_channels_enabled_idx" ON "bnhub_distribution_channels"("enabled");

CREATE INDEX "bnhub_campaign_distributions_campaign_id_idx" ON "bnhub_campaign_distributions"("campaign_id");
CREATE INDEX "bnhub_campaign_distributions_channel_id_idx" ON "bnhub_campaign_distributions"("channel_id");
CREATE INDEX "bnhub_campaign_distributions_distribution_status_idx" ON "bnhub_campaign_distributions"("distribution_status");
CREATE INDEX "bnhub_campaign_distributions_scheduled_at_idx" ON "bnhub_campaign_distributions"("scheduled_at");

CREATE INDEX "bnhub_listing_marketing_profiles_readiness_score_idx" ON "bnhub_listing_marketing_profiles"("readiness_score");

CREATE INDEX "bnhub_marketing_events_campaign_id_idx" ON "bnhub_marketing_events"("campaign_id");
CREATE INDEX "bnhub_marketing_events_distribution_id_idx" ON "bnhub_marketing_events"("distribution_id");
CREATE INDEX "bnhub_marketing_events_event_type_idx" ON "bnhub_marketing_events"("event_type");
CREATE INDEX "bnhub_marketing_events_created_at_idx" ON "bnhub_marketing_events"("created_at");

CREATE INDEX "bnhub_marketing_recommendations_listing_id_idx" ON "bnhub_marketing_recommendations"("listing_id");
CREATE INDEX "bnhub_marketing_recommendations_campaign_id_idx" ON "bnhub_marketing_recommendations"("campaign_id");
CREATE INDEX "bnhub_marketing_recommendations_status_idx" ON "bnhub_marketing_recommendations"("status");
CREATE INDEX "bnhub_marketing_recommendations_priority_idx" ON "bnhub_marketing_recommendations"("priority");

CREATE INDEX "bnhub_email_campaign_queue_campaign_id_idx" ON "bnhub_email_campaign_queue"("campaign_id");
CREATE INDEX "bnhub_email_campaign_queue_listing_id_idx" ON "bnhub_email_campaign_queue"("listing_id");
CREATE INDEX "bnhub_email_campaign_queue_status_idx" ON "bnhub_email_campaign_queue"("status");
CREATE INDEX "bnhub_email_campaign_queue_scheduled_at_idx" ON "bnhub_email_campaign_queue"("scheduled_at");

ALTER TABLE "bnhub_marketing_campaigns" ADD CONSTRAINT "bnhub_marketing_campaigns_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bnhub_marketing_campaigns" ADD CONSTRAINT "bnhub_marketing_campaigns_host_user_id_fkey" FOREIGN KEY ("host_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bnhub_marketing_campaigns" ADD CONSTRAINT "bnhub_marketing_campaigns_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "bnhub_marketing_assets" ADD CONSTRAINT "bnhub_marketing_assets_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "bnhub_marketing_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bnhub_marketing_assets" ADD CONSTRAINT "bnhub_marketing_assets_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bnhub_campaign_distributions" ADD CONSTRAINT "bnhub_campaign_distributions_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "bnhub_marketing_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bnhub_campaign_distributions" ADD CONSTRAINT "bnhub_campaign_distributions_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "bnhub_distribution_channels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "bnhub_listing_marketing_profiles" ADD CONSTRAINT "bnhub_listing_marketing_profiles_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bnhub_marketing_events" ADD CONSTRAINT "bnhub_marketing_events_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "bnhub_marketing_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bnhub_marketing_events" ADD CONSTRAINT "bnhub_marketing_events_distribution_id_fkey" FOREIGN KEY ("distribution_id") REFERENCES "bnhub_campaign_distributions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "bnhub_marketing_recommendations" ADD CONSTRAINT "bnhub_marketing_recommendations_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bnhub_marketing_recommendations" ADD CONSTRAINT "bnhub_marketing_recommendations_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "bnhub_marketing_campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "bnhub_email_campaign_queue" ADD CONSTRAINT "bnhub_email_campaign_queue_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "bnhub_marketing_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bnhub_email_campaign_queue" ADD CONSTRAINT "bnhub_email_campaign_queue_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "bnhub_distribution_channels" ("id", "code", "name", "channel_type", "enabled", "created_at", "updated_at")
VALUES
  (gen_random_uuid()::text, 'internal_homepage', 'BNHub homepage featured', 'INTERNAL', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'internal_destination', 'BNHub destination pages', 'INTERNAL', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'internal_search_boost', 'BNHub search ranking boost', 'INTERNAL', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'internal_email', 'BNHub email campaigns', 'INTERNAL', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'internal_blog_feed', 'BNHub blog / content feed', 'INTERNAL', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'instagram', 'Instagram (adapter — mock / pending compliance)', 'EXTERNAL', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'facebook', 'Facebook (adapter — mock / pending compliance)', 'EXTERNAL', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'tiktok', 'TikTok (adapter — mock / pending compliance)', 'EXTERNAL', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'google_ads', 'Google Ads (adapter — mock / pending compliance)', 'EXTERNAL', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'email_newsletter', 'External email newsletter', 'EXTERNAL', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'whatsapp_export', 'WhatsApp promo export', 'EXPORT', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'pdf_brochure', 'PDF brochure export', 'EXPORT', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;
