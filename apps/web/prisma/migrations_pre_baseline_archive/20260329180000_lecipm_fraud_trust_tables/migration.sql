-- LECIPM rule-based fraud risk (admin-first; complements legacy BNHub fraud tables)

CREATE TABLE "fraud_risk_scores" (
    "id" TEXT NOT NULL,
    "entity_type" VARCHAR(32) NOT NULL,
    "entity_id" VARCHAR(40) NOT NULL,
    "risk_score" DOUBLE PRECISION NOT NULL,
    "risk_level" VARCHAR(16) NOT NULL,
    "score_version" VARCHAR(32) NOT NULL,
    "evidence_json" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fraud_risk_scores_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "fraud_risk_scores_entity_type_entity_id_key" ON "fraud_risk_scores"("entity_type", "entity_id");
CREATE INDEX "fraud_risk_scores_entity_type_risk_level_idx" ON "fraud_risk_scores"("entity_type", "risk_level");
CREATE INDEX "fraud_risk_scores_risk_score_idx" ON "fraud_risk_scores"("risk_score");

CREATE TABLE "fraud_flags" (
    "id" TEXT NOT NULL,
    "entity_type" VARCHAR(32) NOT NULL,
    "entity_id" VARCHAR(40) NOT NULL,
    "flag_type" VARCHAR(64) NOT NULL,
    "severity" VARCHAR(16) NOT NULL,
    "status" VARCHAR(24) NOT NULL DEFAULT 'open',
    "details_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "reviewed_by_id" TEXT,
    "reviewed_at" TIMESTAMP(3),

    CONSTRAINT "fraud_flags_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "fraud_flags_entity_type_entity_id_idx" ON "fraud_flags"("entity_type", "entity_id");
CREATE INDEX "fraud_flags_flag_type_severity_idx" ON "fraud_flags"("flag_type", "severity");
CREATE INDEX "fraud_flags_status_idx" ON "fraud_flags"("status");

CREATE TABLE "fraud_review_queue" (
    "id" TEXT NOT NULL,
    "entity_type" VARCHAR(32) NOT NULL,
    "entity_id" VARCHAR(40) NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "reason_summary" TEXT NOT NULL,
    "status" VARCHAR(24) NOT NULL DEFAULT 'pending',
    "assigned_admin_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fraud_review_queue_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "fraud_review_queue_status_priority_idx" ON "fraud_review_queue"("status", "priority");

CREATE TABLE "fraud_action_logs" (
    "id" TEXT NOT NULL,
    "entity_type" VARCHAR(32) NOT NULL,
    "entity_id" VARCHAR(40) NOT NULL,
    "action_type" VARCHAR(64) NOT NULL,
    "result_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fraud_action_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "fraud_action_logs_entity_type_entity_id_idx" ON "fraud_action_logs"("entity_type", "entity_id");
CREATE INDEX "fraud_action_logs_action_type_created_at_idx" ON "fraud_action_logs"("action_type", "created_at");
