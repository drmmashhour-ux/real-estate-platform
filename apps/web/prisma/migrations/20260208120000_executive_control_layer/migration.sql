-- AI Executive Control Layer: KPI snapshots, recommendations, action audit, entity scores.

CREATE TABLE "executive_kpi_snapshots" (
    "id" TEXT NOT NULL,
    "snapshot_type" VARCHAR(16) NOT NULL,
    "snapshot_date" TIMESTAMP(3) NOT NULL,
    "metrics_json" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "executive_kpi_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "executive_kpi_snapshots_snapshot_type_snapshot_date_idx" ON "executive_kpi_snapshots"("snapshot_type", "snapshot_date");

CREATE TABLE "executive_recommendations" (
    "id" TEXT NOT NULL,
    "recommendation_type" VARCHAR(64) NOT NULL,
    "priority_score" INTEGER NOT NULL DEFAULT 0,
    "status" VARCHAR(24) NOT NULL DEFAULT 'open',
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "details_json" JSONB NOT NULL,
    "evidence_json" JSONB,
    "target_entity_type" VARCHAR(32),
    "target_entity_id" TEXT,
    "safe_auto_action_key" VARCHAR(64),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "executive_recommendations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "executive_recommendations_status_priority_score_idx" ON "executive_recommendations"("status", "priority_score");
CREATE INDEX "executive_recommendations_recommendation_type_idx" ON "executive_recommendations"("recommendation_type");
CREATE INDEX "executive_recommendations_target_entity_type_target_entity_id_idx" ON "executive_recommendations"("target_entity_type", "target_entity_id");

CREATE TABLE "executive_action_runs" (
    "id" TEXT NOT NULL,
    "action_key" TEXT NOT NULL,
    "recommendation_id" TEXT,
    "result_status" TEXT NOT NULL,
    "result_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "executive_action_runs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "executive_action_runs_action_key_idx" ON "executive_action_runs"("action_key");
CREATE INDEX "executive_action_runs_recommendation_id_idx" ON "executive_action_runs"("recommendation_id");

ALTER TABLE "executive_action_runs" ADD CONSTRAINT "executive_action_runs_recommendation_id_fkey" FOREIGN KEY ("recommendation_id") REFERENCES "executive_recommendations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "executive_entity_scores" (
    "id" TEXT NOT NULL,
    "entity_type" VARCHAR(32) NOT NULL,
    "entity_id" TEXT NOT NULL,
    "score_type" VARCHAR(32) NOT NULL,
    "score_value" DOUBLE PRECISION NOT NULL,
    "evidence_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "executive_entity_scores_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "executive_entity_scores_entity_type_entity_id_score_type_key" ON "executive_entity_scores"("entity_type", "entity_id", "score_type");

CREATE INDEX "executive_entity_scores_entity_type_score_type_idx" ON "executive_entity_scores"("entity_type", "score_type");

CREATE INDEX "executive_entity_scores_score_type_score_value_idx" ON "executive_entity_scores"("score_type", "score_value");
