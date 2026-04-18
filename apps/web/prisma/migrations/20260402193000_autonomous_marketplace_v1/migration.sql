-- Autonomous Marketplace V1 audit tables

CREATE TABLE "autonomous_marketplace_runs" (
    "id" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT,
    "scan_scope" TEXT,
    "autonomy_mode" TEXT NOT NULL,
    "dry_run" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL,
    "signals_summary_json" JSONB,
    "observation_json" JSONB,
    "opportunities_json" JSONB,
    "summary_json" JSONB,
    "error_message" TEXT,
    "idempotency_key" TEXT,
    "created_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "autonomous_marketplace_runs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "autonomous_marketplace_runs_idempotency_key_key" ON "autonomous_marketplace_runs"("idempotency_key");

CREATE INDEX "autonomous_marketplace_runs_target_type_target_id_idx" ON "autonomous_marketplace_runs"("target_type", "target_id");

CREATE INDEX "autonomous_marketplace_runs_created_at_idx" ON "autonomous_marketplace_runs"("created_at");

CREATE INDEX "autonomous_marketplace_runs_status_idx" ON "autonomous_marketplace_runs"("status");

CREATE TABLE "autonomous_marketplace_actions" (
    "id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "detector_id" TEXT,
    "action_type" TEXT NOT NULL,
    "proposed_action_json" JSONB NOT NULL,
    "policy_decision_json" JSONB,
    "governance_disposition" TEXT,
    "execution_status" TEXT NOT NULL,
    "execution_result_json" JSONB,
    "outcome_json" JSONB,
    "error_message" TEXT,
    "idempotency_key" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "autonomous_marketplace_actions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "autonomous_marketplace_actions_run_id_idx" ON "autonomous_marketplace_actions"("run_id");

CREATE INDEX "autonomous_marketplace_actions_action_type_idx" ON "autonomous_marketplace_actions"("action_type");

CREATE INDEX "autonomous_marketplace_actions_execution_status_idx" ON "autonomous_marketplace_actions"("execution_status");

CREATE INDEX "autonomous_marketplace_actions_idempotency_key_idx" ON "autonomous_marketplace_actions"("idempotency_key");

ALTER TABLE "autonomous_marketplace_actions" ADD CONSTRAINT "autonomous_marketplace_actions_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "autonomous_marketplace_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "autonomous_marketplace_policy_records" (
    "id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "action_id" TEXT,
    "rule_code" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "disposition_hint" TEXT,
    "reason" TEXT,
    "metadata_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "autonomous_marketplace_policy_records_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "autonomous_marketplace_policy_records_run_id_idx" ON "autonomous_marketplace_policy_records"("run_id");

CREATE INDEX "autonomous_marketplace_policy_records_rule_code_idx" ON "autonomous_marketplace_policy_records"("rule_code");

ALTER TABLE "autonomous_marketplace_policy_records" ADD CONSTRAINT "autonomous_marketplace_policy_records_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "autonomous_marketplace_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "autonomous_marketplace_outcome_records" (
    "id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "action_id" TEXT,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT,
    "snapshot_json" JSONB,
    "metric_delta_json" JSONB,
    "notes" TEXT,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "autonomous_marketplace_outcome_records_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "autonomous_marketplace_outcome_records_run_id_idx" ON "autonomous_marketplace_outcome_records"("run_id");

CREATE INDEX "autonomous_marketplace_outcome_records_target_type_target_id_idx" ON "autonomous_marketplace_outcome_records"("target_type", "target_id");

CREATE INDEX "autonomous_marketplace_outcome_records_recorded_at_idx" ON "autonomous_marketplace_outcome_records"("recorded_at");

ALTER TABLE "autonomous_marketplace_outcome_records" ADD CONSTRAINT "autonomous_marketplace_outcome_records_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "autonomous_marketplace_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
