-- Scenario Autopilot: approval-gated scenario batches (audit trail; no live effect until execute step).

CREATE TABLE "lecipm_scenario_autopilot_runs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" VARCHAR(32) NOT NULL DEFAULT 'GENERATED',
    "candidates_json" JSONB NOT NULL,
    "ranking_json" JSONB,
    "best_candidate_id" TEXT,
    "ranking_rationale" TEXT,
    "approval_payload" JSONB,
    "approved_by_user_id" TEXT,
    "approved_at" TIMESTAMP(3),
    "rejected_by_user_id" TEXT,
    "rejected_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "execution_log_json" JSONB,
    "outcome_json" JSONB,
    "rollback_json" JSONB,
    "baseline_at_generation" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lecipm_scenario_autopilot_runs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lecipm_scenario_autopilot_runs_user_id_created_at_idx" ON "lecipm_scenario_autopilot_runs"("user_id", "created_at");
CREATE INDEX "lecipm_scenario_autopilot_runs_status_created_at_idx" ON "lecipm_scenario_autopilot_runs"("status", "created_at");

ALTER TABLE "lecipm_scenario_autopilot_runs" ADD CONSTRAINT "lecipm_scenario_autopilot_runs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
