-- Ads Automation V4 — loop audit + durable learning snapshots (recommendations remain manual).

CREATE TABLE "ads_automation_loop_runs" (
    "id" TEXT NOT NULL,
    "window_days" INTEGER NOT NULL,
    "aggregate_input" JSONB NOT NULL,
    "aggregate_funnel" JSONB NOT NULL,
    "winners_count" INTEGER NOT NULL DEFAULT 0,
    "weak_count" INTEGER NOT NULL DEFAULT 0,
    "uncertain_count" INTEGER NOT NULL DEFAULT 0,
    "recommendation_count" INTEGER NOT NULL DEFAULT 0,
    "confidence" DOUBLE PRECISION,
    "summary" TEXT,
    "why" TEXT,
    "feature_flags_snapshot" JSONB,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ads_automation_loop_runs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ads_automation_loop_runs_created_at_idx" ON "ads_automation_loop_runs"("created_at");

CREATE TABLE "ads_automation_campaign_results" (
    "id" TEXT NOT NULL,
    "loop_run_id" TEXT NOT NULL,
    "campaign_key" VARCHAR(256) NOT NULL,
    "campaign_label" VARCHAR(512),
    "classification" VARCHAR(32) NOT NULL,
    "confidence" DOUBLE PRECISION,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "leads" INTEGER NOT NULL DEFAULT 0,
    "bookings_started" INTEGER NOT NULL DEFAULT 0,
    "bookings_completed" INTEGER NOT NULL DEFAULT 0,
    "spend" DOUBLE PRECISION,
    "ctr" DOUBLE PRECISION,
    "cpl" DOUBLE PRECISION,
    "conversion_rate" DOUBLE PRECISION,
    "geo_summary" JSONB,
    "evidence" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ads_automation_campaign_results_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ads_automation_campaign_results_loop_run_id_idx" ON "ads_automation_campaign_results"("loop_run_id");
CREATE INDEX "ads_automation_campaign_results_campaign_key_idx" ON "ads_automation_campaign_results"("campaign_key");
CREATE INDEX "ads_automation_campaign_results_classification_idx" ON "ads_automation_campaign_results"("classification");

ALTER TABLE "ads_automation_campaign_results" ADD CONSTRAINT "ads_automation_campaign_results_loop_run_id_fkey" FOREIGN KEY ("loop_run_id") REFERENCES "ads_automation_loop_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ads_automation_recommendations" (
    "id" TEXT NOT NULL,
    "loop_run_id" TEXT NOT NULL,
    "recommendation_type" VARCHAR(64) NOT NULL,
    "target_key" VARCHAR(256),
    "target_label" VARCHAR(512),
    "priority" VARCHAR(16),
    "confidence" DOUBLE PRECISION,
    "evidence_score" DOUBLE PRECISION,
    "reasons" JSONB,
    "operator_action" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ads_automation_recommendations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ads_automation_recommendations_loop_run_id_idx" ON "ads_automation_recommendations"("loop_run_id");
CREATE INDEX "ads_automation_recommendations_recommendation_type_idx" ON "ads_automation_recommendations"("recommendation_type");
CREATE INDEX "ads_automation_recommendations_target_key_idx" ON "ads_automation_recommendations"("target_key");

ALTER TABLE "ads_automation_recommendations" ADD CONSTRAINT "ads_automation_recommendations_loop_run_id_fkey" FOREIGN KEY ("loop_run_id") REFERENCES "ads_automation_loop_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ads_automation_landing_insights" (
    "id" TEXT NOT NULL,
    "loop_run_id" TEXT NOT NULL,
    "segment" VARCHAR(128),
    "issue_type" VARCHAR(64) NOT NULL,
    "severity" VARCHAR(32),
    "confidence" DOUBLE PRECISION,
    "views" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "leads" INTEGER NOT NULL DEFAULT 0,
    "bookings" INTEGER NOT NULL DEFAULT 0,
    "reasons" JSONB,
    "recommendations" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ads_automation_landing_insights_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ads_automation_landing_insights_loop_run_id_idx" ON "ads_automation_landing_insights"("loop_run_id");
CREATE INDEX "ads_automation_landing_insights_issue_type_idx" ON "ads_automation_landing_insights"("issue_type");

ALTER TABLE "ads_automation_landing_insights" ADD CONSTRAINT "ads_automation_landing_insights_loop_run_id_fkey" FOREIGN KEY ("loop_run_id") REFERENCES "ads_automation_loop_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ads_learning_pattern_snapshots" (
    "id" TEXT NOT NULL,
    "pattern_type" VARCHAR(64) NOT NULL,
    "pattern_key" VARCHAR(512) NOT NULL,
    "sentiment" VARCHAR(32) NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "support_count" INTEGER NOT NULL DEFAULT 0,
    "win_count" INTEGER NOT NULL DEFAULT 0,
    "weak_count" INTEGER NOT NULL DEFAULT 0,
    "uncertain_count" INTEGER NOT NULL DEFAULT 0,
    "last_seen_at" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ads_learning_pattern_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ads_learning_pattern_snapshots_pattern_type_pattern_key_sentiment_key" ON "ads_learning_pattern_snapshots"("pattern_type", "pattern_key", "sentiment");
CREATE INDEX "ads_learning_pattern_snapshots_pattern_type_pattern_key_idx" ON "ads_learning_pattern_snapshots"("pattern_type", "pattern_key");
CREATE INDEX "ads_learning_pattern_snapshots_updated_at_idx" ON "ads_learning_pattern_snapshots"("updated_at");

CREATE TABLE "ads_learning_campaign_memory" (
    "id" TEXT NOT NULL,
    "campaign_key" VARCHAR(256) NOT NULL,
    "campaign_label" VARCHAR(512),
    "primary_objective" VARCHAR(256),
    "best_hooks" JSONB,
    "weak_hooks" JSONB,
    "best_ctas" JSONB,
    "weak_ctas" JSONB,
    "best_audiences" JSONB,
    "weak_audiences" JSONB,
    "geo_insights" JSONB,
    "metadata" JSONB,
    "last_classified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ads_learning_campaign_memory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ads_learning_campaign_memory_campaign_key_key" ON "ads_learning_campaign_memory"("campaign_key");
CREATE INDEX "ads_learning_campaign_memory_updated_at_idx" ON "ads_learning_campaign_memory"("updated_at");
