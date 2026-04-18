-- Autonomous engine canonical tables (AutonomousRun, AutonomousAction) — additive only.

CREATE TABLE "autonomous_runs" (
    "id" TEXT NOT NULL,
    "target_type" TEXT,
    "target_id" TEXT,
    "run_payload_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "autonomous_runs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "autonomous_actions" (
    "id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "proposed_action_json" JSONB NOT NULL,
    "policy_decision_json" JSONB NOT NULL,
    "governance_json" JSONB,
    "execution_result_json" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "autonomous_actions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "autonomous_runs_target_type_target_id_idx" ON "autonomous_runs"("target_type", "target_id");

CREATE INDEX "autonomous_runs_created_at_idx" ON "autonomous_runs"("created_at");

CREATE INDEX "autonomous_actions_run_id_idx" ON "autonomous_actions"("run_id");

ALTER TABLE "autonomous_actions" ADD CONSTRAINT "autonomous_actions_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "autonomous_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
