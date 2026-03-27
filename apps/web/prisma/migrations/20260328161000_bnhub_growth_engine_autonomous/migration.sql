-- BNHub Autonomous Global Marketing & Lead Engine
-- RLS: policies target Supabase `authenticated` role; Prisma service DB user typically bypasses RLS.

CREATE TYPE "BnhubGrowthAutonomyLevel" AS ENUM ('OFF', 'ASSISTED', 'SUPERVISED_AUTOPILOT', 'FULL_AUTOPILOT');
CREATE TYPE "BnhubGrowthCampaignType" AS ENUM ('LISTING_PROMO', 'DESTINATION_PROMO', 'SEASONAL', 'RETARGETING', 'LEAD_GEN', 'BOOKING_CONVERSION');
CREATE TYPE "BnhubGrowthCampaignObjective" AS ENUM ('AWARENESS', 'TRAFFIC', 'LEADS', 'INQUIRIES', 'BOOKING_CONVERSION', 'HOST_ACQUISITION');
CREATE TYPE "BnhubGrowthCampaignStatus" AS ENUM ('DRAFT', 'READY', 'AWAITING_APPROVAL', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'FAILED', 'ARCHIVED');
CREATE TYPE "BnhubGrowthBudgetMode" AS ENUM ('MANUAL', 'AI_RECOMMENDED', 'CAPPED_AUTOPILOT');
CREATE TYPE "BnhubGrowthAssetFamily" AS ENUM ('HEADLINE', 'CAPTION', 'SOCIAL_PRIMARY', 'SOCIAL_VARIANT', 'AD_PRIMARY', 'AD_VARIANT', 'LANDING_COPY', 'EMAIL_COPY', 'WHATSAPP_COPY', 'SEO_TITLE', 'SEO_META');
CREATE TYPE "BnhubGrowthAssetApprovalStatus" AS ENUM ('DRAFT', 'APPROVED', 'REJECTED');
CREATE TYPE "BnhubGrowthConnectorType" AS ENUM ('ADS', 'MESSAGING', 'INTERNAL', 'EXPORT');
CREATE TYPE "BnhubGrowthConnectorStatus" AS ENUM ('INACTIVE', 'SETUP_REQUIRED', 'ACTIVE', 'ERROR', 'RESTRICTED');
CREATE TYPE "BnhubGrowthDistributionStatus" AS ENUM ('DRAFT', 'QUEUED', 'AWAITING_APPROVAL', 'SCHEDULED', 'PUBLISHING', 'PUBLISHED', 'FAILED', 'CANCELLED');
CREATE TYPE "BnhubLeadSourceType" AS ENUM ('INTERNAL_FORM', 'META_LEAD', 'GOOGLE_LEAD', 'TIKTOK_LEAD', 'WHATSAPP_MESSAGE', 'MANUAL', 'IMPORT');
CREATE TYPE "BnhubLeadType" AS ENUM ('GUEST_BOOKING', 'SHORT_TERM_INQUIRY', 'HOST_SIGNUP', 'BROKER_LEAD', 'INVESTOR_LEAD');
CREATE TYPE "BnhubLeadTemperature" AS ENUM ('COLD', 'WARM', 'HOT');
CREATE TYPE "BnhubLeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST', 'SPAM');
CREATE TYPE "BnhubLeadEventType" AS ENUM ('CREATED', 'SYNCED', 'SCORED', 'ASSIGNED', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'CLOSED', 'SPAM_FLAGGED');
CREATE TYPE "BnhubLeadEventSource" AS ENUM ('SYSTEM', 'AI', 'CONNECTOR', 'ADMIN', 'HOST');
CREATE TYPE "BnhubGrowthEngineRecommendationType" AS ENUM ('LAUNCH', 'CHANNEL_SHIFT', 'BUDGET_SHIFT', 'COPY_REFRESH', 'CREATIVE_REFRESH', 'LANDING_FIX', 'PRICING_FIX', 'PAUSE_CAMPAIGN', 'BOOST_INTERNAL', 'WHATSAPP_FOLLOWUP');
CREATE TYPE "BnhubGrowthEngineRecommendationStatus" AS ENUM ('OPEN', 'APPLIED', 'DISMISSED', 'EXPIRED');
CREATE TYPE "BnhubGrowthEngineRecommendationPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "BnhubGrowthRuleScopeType" AS ENUM ('GLOBAL', 'HOST', 'LISTING', 'CAMPAIGN');
CREATE TYPE "BnhubGrowthRuleTriggerType" AS ENUM ('LISTING_APPROVED', 'DAILY_SCAN', 'LEAD_DROP', 'LOW_CTR', 'HIGH_CPL', 'HIGH_CONVERSION', 'NO_EXTERIOR_PHOTO', 'NO_RESPONSE', 'ABANDONED_INQUIRY');
CREATE TYPE "BnhubConnectorTokenOwnerType" AS ENUM ('SYSTEM', 'ADMIN', 'HOST');
CREATE TYPE "BnhubConnectorTokenStatus" AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED', 'ROTATING');
CREATE TYPE "BnhubGrowthAuditActorType" AS ENUM ('SYSTEM', 'AI', 'ADMIN', 'HOST', 'CONNECTOR_WEBHOOK');

CREATE TABLE "bnhub_growth_connectors" (
    "id" TEXT NOT NULL,
    "connector_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "connector_type" "BnhubGrowthConnectorType" NOT NULL,
    "status" "BnhubGrowthConnectorStatus" NOT NULL DEFAULT 'INACTIVE',
    "capabilities_json" JSONB,
    "config_json" JSONB,
    "last_healthcheck_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "bnhub_growth_connectors_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "bnhub_growth_connectors_connector_code_key" ON "bnhub_growth_connectors"("connector_code");
CREATE INDEX "bnhub_growth_connectors_connector_type_idx" ON "bnhub_growth_connectors"("connector_type");
CREATE INDEX "bnhub_growth_connectors_status_idx" ON "bnhub_growth_connectors"("status");

CREATE TABLE "bnhub_growth_campaigns" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "host_user_id" TEXT NOT NULL,
    "created_by" TEXT,
    "campaign_name" TEXT NOT NULL,
    "campaign_type" "BnhubGrowthCampaignType" NOT NULL,
    "objective" "BnhubGrowthCampaignObjective" NOT NULL,
    "autonomy_level" "BnhubGrowthAutonomyLevel" NOT NULL DEFAULT 'OFF',
    "status" "BnhubGrowthCampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "primary_angle" TEXT,
    "target_region" TEXT,
    "target_country" TEXT,
    "target_city" TEXT,
    "target_audience_json" JSONB,
    "language_set_json" JSONB,
    "budget_mode" "BnhubGrowthBudgetMode" NOT NULL DEFAULT 'MANUAL',
    "budget_daily_cents" INTEGER,
    "budget_total_cents" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'CAD',
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "ai_strategy_summary" TEXT,
    "policy_flags_json" JSONB,
    "last_optimization_at" TIMESTAMP(3),
    "promo_slug" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "bnhub_growth_campaigns_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "bnhub_growth_campaigns_promo_slug_key" ON "bnhub_growth_campaigns"("promo_slug");
CREATE INDEX "bnhub_growth_campaigns_listing_id_idx" ON "bnhub_growth_campaigns"("listing_id");
CREATE INDEX "bnhub_growth_campaigns_host_user_id_idx" ON "bnhub_growth_campaigns"("host_user_id");
CREATE INDEX "bnhub_growth_campaigns_status_idx" ON "bnhub_growth_campaigns"("status");
CREATE INDEX "bnhub_growth_campaigns_autonomy_level_idx" ON "bnhub_growth_campaigns"("autonomy_level");
CREATE INDEX "bnhub_growth_campaigns_created_at_idx" ON "bnhub_growth_campaigns"("created_at");

CREATE TABLE "bnhub_growth_assets" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "asset_family" "BnhubGrowthAssetFamily" NOT NULL,
    "language_code" TEXT NOT NULL DEFAULT 'en',
    "tone" "BnhubMarketingTone" NOT NULL DEFAULT 'PROFESSIONAL',
    "platform_hint" TEXT,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "cta_text" TEXT,
    "metadata_json" JSONB,
    "ai_generated" BOOLEAN NOT NULL DEFAULT true,
    "human_edited" BOOLEAN NOT NULL DEFAULT false,
    "approval_status" "BnhubGrowthAssetApprovalStatus" NOT NULL DEFAULT 'DRAFT',
    "version_no" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "bnhub_growth_assets_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "bnhub_growth_assets_campaign_id_idx" ON "bnhub_growth_assets"("campaign_id");
CREATE INDEX "bnhub_growth_assets_listing_id_idx" ON "bnhub_growth_assets"("listing_id");
CREATE INDEX "bnhub_growth_assets_asset_family_idx" ON "bnhub_growth_assets"("asset_family");
CREATE INDEX "bnhub_growth_assets_language_code_idx" ON "bnhub_growth_assets"("language_code");
CREATE INDEX "bnhub_growth_assets_approval_status_idx" ON "bnhub_growth_assets"("approval_status");

CREATE TABLE "bnhub_growth_distributions" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "connector_id" TEXT NOT NULL,
    "asset_bundle_json" JSONB,
    "distribution_status" "BnhubGrowthDistributionStatus" NOT NULL DEFAULT 'DRAFT',
    "scheduled_at" TIMESTAMP(3),
    "published_at" TIMESTAMP(3),
    "external_ref" TEXT,
    "destination_ref" TEXT,
    "payload_json" JSONB,
    "response_summary" TEXT,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "leads" INTEGER NOT NULL DEFAULT 0,
    "messages" INTEGER NOT NULL DEFAULT 0,
    "inquiries" INTEGER NOT NULL DEFAULT 0,
    "bookings" INTEGER NOT NULL DEFAULT 0,
    "spend_cents" INTEGER NOT NULL DEFAULT 0,
    "attributed_revenue_cents" INTEGER NOT NULL DEFAULT 0,
    "roi_estimate" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "bnhub_growth_distributions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "bnhub_growth_distributions_campaign_id_idx" ON "bnhub_growth_distributions"("campaign_id");
CREATE INDEX "bnhub_growth_distributions_connector_id_idx" ON "bnhub_growth_distributions"("connector_id");
CREATE INDEX "bnhub_growth_distributions_distribution_status_idx" ON "bnhub_growth_distributions"("distribution_status");
CREATE INDEX "bnhub_growth_distributions_scheduled_at_idx" ON "bnhub_growth_distributions"("scheduled_at");

CREATE TABLE "bnhub_leads" (
    "id" TEXT NOT NULL,
    "source_type" "BnhubLeadSourceType" NOT NULL,
    "source_connector_code" TEXT,
    "external_lead_ref" TEXT,
    "listing_id" TEXT,
    "campaign_id" TEXT,
    "distribution_id" TEXT,
    "host_user_id" TEXT,
    "lead_type" "BnhubLeadType" NOT NULL,
    "full_name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "country" TEXT,
    "city" TEXT,
    "preferred_language" TEXT,
    "message" TEXT,
    "travel_dates_json" JSONB,
    "budget_min_cents" INTEGER,
    "budget_max_cents" INTEGER,
    "guest_count" INTEGER,
    "lead_score" INTEGER NOT NULL DEFAULT 0,
    "lead_temperature" "BnhubLeadTemperature" NOT NULL DEFAULT 'COLD',
    "status" "BnhubLeadStatus" NOT NULL DEFAULT 'NEW',
    "owner_user_id" TEXT,
    "enrichment_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "bnhub_leads_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "bnhub_leads_listing_id_idx" ON "bnhub_leads"("listing_id");
CREATE INDEX "bnhub_leads_campaign_id_idx" ON "bnhub_leads"("campaign_id");
CREATE INDEX "bnhub_leads_distribution_id_idx" ON "bnhub_leads"("distribution_id");
CREATE INDEX "bnhub_leads_host_user_id_idx" ON "bnhub_leads"("host_user_id");
CREATE INDEX "bnhub_leads_status_idx" ON "bnhub_leads"("status");
CREATE INDEX "bnhub_leads_lead_temperature_idx" ON "bnhub_leads"("lead_temperature");
CREATE INDEX "bnhub_leads_created_at_idx" ON "bnhub_leads"("created_at");
CREATE INDEX "bnhub_leads_source_type_idx" ON "bnhub_leads"("source_type");

CREATE TABLE "bnhub_lead_events" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "event_type" "BnhubLeadEventType" NOT NULL,
    "event_source" "BnhubLeadEventSource" NOT NULL,
    "event_data_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bnhub_lead_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "bnhub_lead_events_lead_id_idx" ON "bnhub_lead_events"("lead_id");
CREATE INDEX "bnhub_lead_events_event_type_idx" ON "bnhub_lead_events"("event_type");
CREATE INDEX "bnhub_lead_events_created_at_idx" ON "bnhub_lead_events"("created_at");

CREATE TABLE "bnhub_growth_recommendations" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT,
    "campaign_id" TEXT,
    "recommendation_type" "BnhubGrowthEngineRecommendationType" NOT NULL,
    "priority" "BnhubGrowthEngineRecommendationPriority" NOT NULL DEFAULT 'MEDIUM',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "action_payload_json" JSONB,
    "status" "BnhubGrowthEngineRecommendationStatus" NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "bnhub_growth_recommendations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "bnhub_growth_recommendations_listing_id_idx" ON "bnhub_growth_recommendations"("listing_id");
CREATE INDEX "bnhub_growth_recommendations_campaign_id_idx" ON "bnhub_growth_recommendations"("campaign_id");
CREATE INDEX "bnhub_growth_recommendations_status_idx" ON "bnhub_growth_recommendations"("status");
CREATE INDEX "bnhub_growth_recommendations_priority_idx" ON "bnhub_growth_recommendations"("priority");

CREATE TABLE "bnhub_growth_rules" (
    "id" TEXT NOT NULL,
    "scope_type" "BnhubGrowthRuleScopeType" NOT NULL,
    "scope_id" TEXT,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "rule_name" TEXT NOT NULL,
    "trigger_type" "BnhubGrowthRuleTriggerType" NOT NULL,
    "conditions_json" JSONB,
    "actions_json" JSONB,
    "cooldown_minutes" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "bnhub_growth_rules_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "bnhub_growth_rules_scope_type_idx" ON "bnhub_growth_rules"("scope_type");
CREATE INDEX "bnhub_growth_rules_scope_id_idx" ON "bnhub_growth_rules"("scope_id");
CREATE INDEX "bnhub_growth_rules_trigger_type_idx" ON "bnhub_growth_rules"("trigger_type");
CREATE INDEX "bnhub_growth_rules_is_enabled_idx" ON "bnhub_growth_rules"("is_enabled");

CREATE TABLE "bnhub_connector_tokens" (
    "id" TEXT NOT NULL,
    "connector_code" TEXT NOT NULL,
    "owner_type" "BnhubConnectorTokenOwnerType" NOT NULL,
    "owner_id" TEXT,
    "token_status" "BnhubConnectorTokenStatus" NOT NULL DEFAULT 'ACTIVE',
    "encrypted_secret_ref" TEXT,
    "metadata_json" JSONB,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "bnhub_connector_tokens_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "bnhub_connector_tokens_connector_code_idx" ON "bnhub_connector_tokens"("connector_code");
CREATE INDEX "bnhub_connector_tokens_owner_type_owner_id_idx" ON "bnhub_connector_tokens"("owner_type", "owner_id");
CREATE INDEX "bnhub_connector_tokens_token_status_idx" ON "bnhub_connector_tokens"("token_status");

CREATE TABLE "bnhub_growth_audit_logs" (
    "id" TEXT NOT NULL,
    "actor_type" "BnhubGrowthAuditActorType" NOT NULL,
    "actor_id" TEXT,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action_type" TEXT NOT NULL,
    "action_summary" TEXT NOT NULL,
    "before_json" JSONB,
    "after_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bnhub_growth_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "bnhub_growth_audit_logs_entity_type_entity_id_idx" ON "bnhub_growth_audit_logs"("entity_type", "entity_id");
CREATE INDEX "bnhub_growth_audit_logs_actor_type_idx" ON "bnhub_growth_audit_logs"("actor_type");
CREATE INDEX "bnhub_growth_audit_logs_created_at_idx" ON "bnhub_growth_audit_logs"("created_at");

-- Foreign keys
ALTER TABLE "bnhub_growth_campaigns" ADD CONSTRAINT "bnhub_growth_campaigns_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bnhub_growth_campaigns" ADD CONSTRAINT "bnhub_growth_campaigns_host_user_id_fkey" FOREIGN KEY ("host_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bnhub_growth_campaigns" ADD CONSTRAINT "bnhub_growth_campaigns_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "bnhub_growth_assets" ADD CONSTRAINT "bnhub_growth_assets_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "bnhub_growth_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bnhub_growth_assets" ADD CONSTRAINT "bnhub_growth_assets_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bnhub_growth_distributions" ADD CONSTRAINT "bnhub_growth_distributions_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "bnhub_growth_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bnhub_growth_distributions" ADD CONSTRAINT "bnhub_growth_distributions_connector_id_fkey" FOREIGN KEY ("connector_id") REFERENCES "bnhub_growth_connectors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "bnhub_leads" ADD CONSTRAINT "bnhub_leads_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "bnhub_leads" ADD CONSTRAINT "bnhub_leads_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "bnhub_growth_campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "bnhub_leads" ADD CONSTRAINT "bnhub_leads_distribution_id_fkey" FOREIGN KEY ("distribution_id") REFERENCES "bnhub_growth_distributions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "bnhub_leads" ADD CONSTRAINT "bnhub_leads_host_user_id_fkey" FOREIGN KEY ("host_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "bnhub_leads" ADD CONSTRAINT "bnhub_leads_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "bnhub_lead_events" ADD CONSTRAINT "bnhub_lead_events_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "bnhub_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bnhub_growth_recommendations" ADD CONSTRAINT "bnhub_growth_recommendations_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bnhub_growth_recommendations" ADD CONSTRAINT "bnhub_growth_recommendations_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "bnhub_growth_campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed connectors (idempotent)
INSERT INTO "bnhub_growth_connectors" ("id", "connector_code", "name", "connector_type", "status", "capabilities_json", "created_at", "updated_at")
VALUES
  (gen_random_uuid()::text, 'meta_ads', 'Meta Ads (Marketing API — pending integration)', 'ADS', 'SETUP_REQUIRED', '{"realApi":"pending","notes":"Requires business verification + ad account"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'google_ads', 'Google Ads API — pending integration', 'ADS', 'SETUP_REQUIRED', '{"realApi":"pending"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'tiktok_ads', 'TikTok for Business — pending integration', 'ADS', 'SETUP_REQUIRED', '{"realApi":"pending"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'whatsapp_business', 'WhatsApp Business / Marketing messages — pending integration', 'MESSAGING', 'SETUP_REQUIRED', '{"templatesRequired":true}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'internal_homepage', 'BNHub homepage featured', 'INTERNAL', 'ACTIVE', '{"internal":true}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'internal_search_boost', 'BNHub search boost (capped)', 'INTERNAL', 'ACTIVE', '{"internal":true}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'internal_email', 'BNHub internal email queue', 'INTERNAL', 'ACTIVE', '{"internal":true}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("connector_code") DO NOTHING;

-- ---------------------------------------------------------------------------
-- Row Level Security (Supabase `authenticated` JWT must match "User".id)
-- ---------------------------------------------------------------------------
ALTER TABLE "bnhub_growth_campaigns" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bnhub_growth_assets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bnhub_growth_distributions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bnhub_leads" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bnhub_lead_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bnhub_growth_recommendations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bnhub_growth_rules" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bnhub_connector_tokens" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bnhub_growth_audit_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bnhub_growth_connectors" ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_platform_admin_uid() RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM "User" u
    WHERE u.id = (auth.uid())::text AND u.role = 'ADMIN'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Campaigns: host owns or admin
CREATE POLICY "bnhub_growth_campaigns_rw_host_admin" ON "bnhub_growth_campaigns"
  FOR ALL TO authenticated
  USING (host_user_id = (auth.uid())::text OR public.is_platform_admin_uid())
  WITH CHECK (host_user_id = (auth.uid())::text OR public.is_platform_admin_uid());

-- Assets: via campaign ownership
CREATE POLICY "bnhub_growth_assets_rw_host_admin" ON "bnhub_growth_assets"
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM "bnhub_growth_campaigns" c WHERE c.id = campaign_id AND (c.host_user_id = (auth.uid())::text OR public.is_platform_admin_uid()))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM "bnhub_growth_campaigns" c WHERE c.id = campaign_id AND (c.host_user_id = (auth.uid())::text OR public.is_platform_admin_uid()))
  );

-- Distributions: via campaign
CREATE POLICY "bnhub_growth_distributions_rw_host_admin" ON "bnhub_growth_distributions"
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM "bnhub_growth_campaigns" c WHERE c.id = campaign_id AND (c.host_user_id = (auth.uid())::text OR public.is_platform_admin_uid()))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM "bnhub_growth_campaigns" c WHERE c.id = campaign_id AND (c.host_user_id = (auth.uid())::text OR public.is_platform_admin_uid()))
  );

-- Leads: host, assignee, or admin
CREATE POLICY "bnhub_leads_rw_scope" ON "bnhub_leads"
  FOR ALL TO authenticated
  USING (
    public.is_platform_admin_uid()
    OR host_user_id = (auth.uid())::text
    OR owner_user_id = (auth.uid())::text
  )
  WITH CHECK (
    public.is_platform_admin_uid()
    OR host_user_id = (auth.uid())::text
    OR owner_user_id = (auth.uid())::text
  );

-- Lead events: same as parent lead
CREATE POLICY "bnhub_lead_events_rw_scope" ON "bnhub_lead_events"
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "bnhub_leads" l
      WHERE l.id = lead_id AND (
        public.is_platform_admin_uid()
        OR l.host_user_id = (auth.uid())::text
        OR l.owner_user_id = (auth.uid())::text
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "bnhub_leads" l
      WHERE l.id = lead_id AND (
        public.is_platform_admin_uid()
        OR l.host_user_id = (auth.uid())::text
        OR l.owner_user_id = (auth.uid())::text
      )
    )
  );

-- Recommendations: listing owner or admin
CREATE POLICY "bnhub_growth_recommendations_rw" ON "bnhub_growth_recommendations"
  FOR ALL TO authenticated
  USING (
    public.is_platform_admin_uid()
    OR (listing_id IS NOT NULL AND EXISTS (SELECT 1 FROM "bnhub_listings" s WHERE s.id = listing_id AND s.host_id = (auth.uid())::text))
    OR (campaign_id IS NOT NULL AND EXISTS (SELECT 1 FROM "bnhub_growth_campaigns" c WHERE c.id = campaign_id AND c.host_user_id = (auth.uid())::text))
  )
  WITH CHECK (
    public.is_platform_admin_uid()
    OR (listing_id IS NOT NULL AND EXISTS (SELECT 1 FROM "bnhub_listings" s WHERE s.id = listing_id AND s.host_id = (auth.uid())::text))
    OR (campaign_id IS NOT NULL AND EXISTS (SELECT 1 FROM "bnhub_growth_campaigns" c WHERE c.id = campaign_id AND c.host_user_id = (auth.uid())::text))
  );

-- Rules, tokens, audit: admin only
CREATE POLICY "bnhub_growth_rules_admin" ON "bnhub_growth_rules"
  FOR ALL TO authenticated
  USING (public.is_platform_admin_uid())
  WITH CHECK (public.is_platform_admin_uid());

CREATE POLICY "bnhub_connector_tokens_admin" ON "bnhub_connector_tokens"
  FOR ALL TO authenticated
  USING (public.is_platform_admin_uid())
  WITH CHECK (public.is_platform_admin_uid());

CREATE POLICY "bnhub_growth_audit_logs_admin" ON "bnhub_growth_audit_logs"
  FOR ALL TO authenticated
  USING (public.is_platform_admin_uid())
  WITH CHECK (public.is_platform_admin_uid());

-- Connectors: read for authenticated (health UI); writes admin-only
CREATE POLICY "bnhub_growth_connectors_select_auth" ON "bnhub_growth_connectors"
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "bnhub_growth_connectors_write_admin" ON "bnhub_growth_connectors"
  FOR INSERT TO authenticated
  WITH CHECK (public.is_platform_admin_uid());

CREATE POLICY "bnhub_growth_connectors_update_admin" ON "bnhub_growth_connectors"
  FOR UPDATE TO authenticated
  USING (public.is_platform_admin_uid())
  WITH CHECK (public.is_platform_admin_uid());

CREATE POLICY "bnhub_growth_connectors_delete_admin" ON "bnhub_growth_connectors"
  FOR DELETE TO authenticated
  USING (public.is_platform_admin_uid());
