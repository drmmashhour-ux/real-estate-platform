-- Growth Autopilot v2 — SEO drafts, social/campaign candidates, referral attribution, experiment snapshots.

ALTER TABLE "seo_page_opportunities" ADD COLUMN IF NOT EXISTS "transaction_type" VARCHAR(24);
ALTER TABLE "seo_page_opportunities" ADD COLUMN IF NOT EXISTS "budget_min_cents" INTEGER;
ALTER TABLE "seo_page_opportunities" ADD COLUMN IF NOT EXISTS "budget_max_cents" INTEGER;
ALTER TABLE "seo_page_opportunities" ADD COLUMN IF NOT EXISTS "bedroom_count" INTEGER;
ALTER TABLE "seo_page_opportunities" ADD COLUMN IF NOT EXISTS "page_family" VARCHAR(64);
ALTER TABLE "seo_page_opportunities" ADD COLUMN IF NOT EXISTS "seo_scores_json" JSONB;
ALTER TABLE "seo_page_opportunities" ADD COLUMN IF NOT EXISTS "duplicate_risk_score" DOUBLE PRECISION;
ALTER TABLE "seo_page_opportunities" ADD COLUMN IF NOT EXISTS "last_evaluated_at" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "seo_page_opportunities_page_family_idx" ON "seo_page_opportunities"("page_family");

CREATE TABLE IF NOT EXISTS "seo_page_drafts" (
    "id" TEXT NOT NULL,
    "seo_page_opportunity_id" TEXT NOT NULL,
    "draft_status" VARCHAR(24) NOT NULL DEFAULT 'draft_ready',
    "publish_status" VARCHAR(24) NOT NULL DEFAULT 'not_published',
    "title" VARCHAR(512) NOT NULL,
    "meta_title" VARCHAR(512) NOT NULL,
    "meta_description" TEXT NOT NULL,
    "canonical_slug" VARCHAR(256) NOT NULL,
    "content_json" JSONB NOT NULL DEFAULT '{}',
    "last_generated_at" TIMESTAMP(3),
    "reviewed_at" TIMESTAMP(3),
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "seo_page_drafts_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "seo_page_drafts_seo_page_opportunity_id_key" ON "seo_page_drafts"("seo_page_opportunity_id");
CREATE INDEX IF NOT EXISTS "seo_page_drafts_draft_status_idx" ON "seo_page_drafts"("draft_status");
CREATE INDEX IF NOT EXISTS "seo_page_drafts_publish_status_idx" ON "seo_page_drafts"("publish_status");
ALTER TABLE "seo_page_drafts" ADD CONSTRAINT "seo_page_drafts_seo_page_opportunity_id_fkey" FOREIGN KEY ("seo_page_opportunity_id") REFERENCES "seo_page_opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "seo_page_publish_logs" (
    "id" TEXT NOT NULL,
    "seo_page_opportunity_id" TEXT NOT NULL,
    "action" VARCHAR(32) NOT NULL,
    "actor_user_id" TEXT,
    "detail_json" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "seo_page_publish_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "seo_page_publish_logs_seo_page_opportunity_id_idx" ON "seo_page_publish_logs"("seo_page_opportunity_id");
ALTER TABLE "seo_page_publish_logs" ADD CONSTRAINT "seo_page_publish_logs_seo_page_opportunity_id_fkey" FOREIGN KEY ("seo_page_opportunity_id") REFERENCES "seo_page_opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "social_content_candidates" (
    "id" TEXT NOT NULL,
    "target_type" VARCHAR(32) NOT NULL,
    "target_id" VARCHAR(40) NOT NULL,
    "status" VARCHAR(24) NOT NULL DEFAULT 'candidate',
    "social_candidate_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "scores_json" JSONB NOT NULL DEFAULT '{}',
    "content_package_json" JSONB NOT NULL DEFAULT '{}',
    "compliance_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "social_content_candidates_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "social_content_candidates_target_type_target_id_idx" ON "social_content_candidates"("target_type", "target_id");
CREATE INDEX IF NOT EXISTS "social_content_candidates_status_idx" ON "social_content_candidates"("status");
CREATE INDEX IF NOT EXISTS "social_content_candidates_social_candidate_score_idx" ON "social_content_candidates"("social_candidate_score");

CREATE TABLE IF NOT EXISTS "growth_autopilot_campaign_candidates" (
    "id" TEXT NOT NULL,
    "campaign_kind" VARCHAR(64) NOT NULL,
    "audience_key" VARCHAR(128),
    "user_id" VARCHAR(40),
    "target_type" VARCHAR(32) NOT NULL,
    "target_id" VARCHAR(40) NOT NULL,
    "status" VARCHAR(24) NOT NULL DEFAULT 'candidate',
    "blocked_reason" TEXT,
    "metadata_json" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "growth_autopilot_campaign_candidates_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "growth_autopilot_campaign_candidates_status_campaign_kind_idx" ON "growth_autopilot_campaign_candidates"("status", "campaign_kind");
CREATE INDEX IF NOT EXISTS "growth_autopilot_campaign_candidates_user_id_idx" ON "growth_autopilot_campaign_candidates"("user_id");

CREATE TABLE IF NOT EXISTS "referral_growth_attributions" (
    "id" TEXT NOT NULL,
    "referral_code" VARCHAR(64) NOT NULL,
    "session_id" VARCHAR(128),
    "owner_user_id" VARCHAR(40) NOT NULL,
    "attributed_user_id" VARCHAR(40),
    "event_type" VARCHAR(48),
    "attribution_status" VARCHAR(24) NOT NULL DEFAULT 'pending',
    "suspicion_score" INTEGER,
    "review_status" VARCHAR(24),
    "reward_status" VARCHAR(24),
    "metadata_json" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "converted_at" TIMESTAMP(3),
    CONSTRAINT "referral_growth_attributions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "referral_growth_attributions_referral_code_idx" ON "referral_growth_attributions"("referral_code");
CREATE INDEX IF NOT EXISTS "referral_growth_attributions_owner_user_id_idx" ON "referral_growth_attributions"("owner_user_id");
CREATE INDEX IF NOT EXISTS "referral_growth_attributions_attributed_user_id_idx" ON "referral_growth_attributions"("attributed_user_id");
CREATE INDEX IF NOT EXISTS "referral_growth_attributions_attribution_status_idx" ON "referral_growth_attributions"("attribution_status");

CREATE TABLE IF NOT EXISTS "campaign_suppression_logs" (
    "id" TEXT NOT NULL,
    "user_id" VARCHAR(40),
    "session_id" VARCHAR(128),
    "campaign_kind" VARCHAR(64) NOT NULL,
    "reason" VARCHAR(256) NOT NULL,
    "metadata_json" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "campaign_suppression_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "campaign_suppression_logs_user_id_idx" ON "campaign_suppression_logs"("user_id");
CREATE INDEX IF NOT EXISTS "campaign_suppression_logs_campaign_kind_created_at_idx" ON "campaign_suppression_logs"("campaign_kind", "created_at");

CREATE TABLE IF NOT EXISTS "experiment_result_snapshots" (
    "id" TEXT NOT NULL,
    "experiment_id" TEXT NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "metrics_json" JSONB NOT NULL,
    "guardrail_warnings_json" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "experiment_result_snapshots_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "experiment_result_snapshots_experiment_id_idx" ON "experiment_result_snapshots"("experiment_id");
ALTER TABLE "experiment_result_snapshots" ADD CONSTRAINT "experiment_result_snapshots_experiment_id_fkey" FOREIGN KEY ("experiment_id") REFERENCES "experiments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
