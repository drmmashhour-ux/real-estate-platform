-- Growth Autopilot v3 — signal stream, brain memory, SEO clusters, flywheel snapshots.

CREATE TABLE IF NOT EXISTS "growth_signal_events" (
    "id" TEXT NOT NULL,
    "event_name" VARCHAR(64) NOT NULL,
    "user_id" VARCHAR(40),
    "session_id" VARCHAR(128),
    "entity_type" VARCHAR(32),
    "entity_id" VARCHAR(64),
    "payload_json" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "growth_signal_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "growth_signal_events_event_name_created_at_idx" ON "growth_signal_events"("event_name", "created_at");
CREATE INDEX IF NOT EXISTS "growth_signal_events_user_id_created_at_idx" ON "growth_signal_events"("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "growth_signal_events_session_id_idx" ON "growth_signal_events"("session_id");

CREATE TABLE IF NOT EXISTS "growth_brain_memories" (
    "id" TEXT NOT NULL,
    "scope_key" VARCHAR(160) NOT NULL,
    "weights_json" JSONB NOT NULL DEFAULT '{}',
    "stats_json" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "growth_brain_memories_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "growth_brain_memories_scope_key_key" ON "growth_brain_memories"("scope_key");

CREATE TABLE IF NOT EXISTS "growth_brain_decision_logs" (
    "id" TEXT NOT NULL,
    "decision_type" VARCHAR(64) NOT NULL,
    "input_json" JSONB NOT NULL,
    "output_json" JSONB NOT NULL,
    "explanation" TEXT NOT NULL,
    "risk_score" INTEGER,
    "autonomy_mode" VARCHAR(24),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "growth_brain_decision_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "growth_brain_decision_logs_decision_type_created_at_idx" ON "growth_brain_decision_logs"("decision_type", "created_at");

CREATE TABLE IF NOT EXISTS "seo_topic_clusters" (
    "id" TEXT NOT NULL,
    "slug" VARCHAR(256) NOT NULL,
    "label" VARCHAR(512) NOT NULL,
    "pillar_page_slug" VARCHAR(256),
    "member_slugs_json" JSONB NOT NULL DEFAULT '[]',
    "status" VARCHAR(24) NOT NULL DEFAULT 'candidate',
    "metadata_json" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "seo_topic_clusters_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "seo_topic_clusters_slug_key" ON "seo_topic_clusters"("slug");
CREATE INDEX IF NOT EXISTS "seo_topic_clusters_status_idx" ON "seo_topic_clusters"("status");

CREATE TABLE IF NOT EXISTS "seo_internal_link_suggestions" (
    "id" TEXT NOT NULL,
    "source_slug" VARCHAR(256) NOT NULL,
    "target_slug" VARCHAR(256) NOT NULL,
    "suggestion_type" VARCHAR(32) NOT NULL,
    "status" VARCHAR(24) NOT NULL DEFAULT 'suggested',
    "metadata_json" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "seo_internal_link_suggestions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "seo_internal_link_suggestions_source_slug_idx" ON "seo_internal_link_suggestions"("source_slug");
CREATE INDEX IF NOT EXISTS "seo_internal_link_suggestions_target_slug_idx" ON "seo_internal_link_suggestions"("target_slug");

CREATE TABLE IF NOT EXISTS "growth_experiment_suggestions" (
    "id" TEXT NOT NULL,
    "hypothesis" TEXT NOT NULL,
    "experiment_kind" VARCHAR(64) NOT NULL,
    "status" VARCHAR(24) NOT NULL DEFAULT 'suggested',
    "metadata_json" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "growth_experiment_suggestions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "growth_experiment_suggestions_status_idx" ON "growth_experiment_suggestions"("status");

CREATE TABLE IF NOT EXISTS "growth_flywheel_snapshots" (
    "id" TEXT NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "metrics_json" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "growth_flywheel_snapshots_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "growth_flywheel_snapshots_period_end_idx" ON "growth_flywheel_snapshots"("period_end");

CREATE TABLE IF NOT EXISTS "seo_page_refresh_jobs" (
    "id" TEXT NOT NULL,
    "seo_page_opportunity_id" TEXT NOT NULL,
    "reason" VARCHAR(128) NOT NULL,
    "status" VARCHAR(24) NOT NULL DEFAULT 'queued',
    "metadata_json" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),
    CONSTRAINT "seo_page_refresh_jobs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "seo_page_refresh_jobs_status_created_at_idx" ON "seo_page_refresh_jobs"("status", "created_at");
ALTER TABLE "seo_page_refresh_jobs" ADD CONSTRAINT "seo_page_refresh_jobs_seo_page_opportunity_id_fkey" FOREIGN KEY ("seo_page_opportunity_id") REFERENCES "seo_page_opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
