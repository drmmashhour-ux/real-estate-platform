-- LECIPM multi-city operating mode

CREATE TABLE "city_operation_profiles" (
    "id" TEXT NOT NULL,
    "city_key" VARCHAR(64) NOT NULL,
    "city_name" VARCHAR(128) NOT NULL,
    "province_or_state" VARCHAR(64),
    "country_code" VARCHAR(8),
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "launch_stage" VARCHAR(24) NOT NULL DEFAULT 'planned',
    "city_type" VARCHAR(32),
    "listing_type_support_json" JSONB,
    "growth_config_json" JSONB,
    "ranking_config_key" VARCHAR(128),
    "messaging_config_json" JSONB,
    "fraud_config_json" JSONB,
    "trust_config_json" JSONB,
    "launch_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "city_operation_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "city_operation_profiles_city_key_key" ON "city_operation_profiles"("city_key");
CREATE INDEX "city_operation_profiles_is_active_launch_stage_idx" ON "city_operation_profiles"("is_active", "launch_stage");

CREATE TABLE "city_kpi_snapshots" (
    "id" TEXT NOT NULL,
    "city_key" VARCHAR(64) NOT NULL,
    "snapshot_type" VARCHAR(16) NOT NULL,
    "snapshot_date" TIMESTAMP(3) NOT NULL,
    "metrics_json" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "city_kpi_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "city_kpi_snapshots_city_key_snapshot_type_snapshot_date_key" ON "city_kpi_snapshots"("city_key", "snapshot_type", "snapshot_date");
CREATE INDEX "city_kpi_snapshots_city_key_snapshot_type_snapshot_date_idx" ON "city_kpi_snapshots"("city_key", "snapshot_type", "snapshot_date");

CREATE TABLE "city_recommendations" (
    "id" TEXT NOT NULL,
    "city_key" VARCHAR(64) NOT NULL,
    "recommendation_type" VARCHAR(64) NOT NULL,
    "priority_score" INTEGER NOT NULL DEFAULT 0,
    "status" VARCHAR(24) NOT NULL DEFAULT 'open',
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "details_json" JSONB NOT NULL,
    "evidence_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "city_recommendations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "city_recommendations_city_key_status_priority_score_idx" ON "city_recommendations"("city_key", "status", "priority_score");

CREATE TABLE "city_rollout_events" (
    "id" TEXT NOT NULL,
    "city_key" VARCHAR(64) NOT NULL,
    "event_type" VARCHAR(64) NOT NULL,
    "details_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "city_rollout_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "city_rollout_events_city_key_event_type_idx" ON "city_rollout_events"("city_key", "event_type");
