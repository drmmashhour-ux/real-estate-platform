-- BNHub autonomy: counterfactual evaluation + uplift-adjusted learning (deterministic estimates).

ALTER TABLE "autonomy_outcomes" ADD COLUMN IF NOT EXISTS "expected_reward_score" DOUBLE PRECISION;
ALTER TABLE "autonomy_outcomes" ADD COLUMN IF NOT EXISTS "uplift_adjusted_reward" DOUBLE PRECISION;
ALTER TABLE "autonomy_outcomes" ADD COLUMN IF NOT EXISTS "counterfactual_eval_id" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "autonomy_outcomes_counterfactual_eval_id_key" ON "autonomy_outcomes"("counterfactual_eval_id");

CREATE TABLE IF NOT EXISTS "counterfactual_evaluations" (
    "id" TEXT NOT NULL,
    "action_id" TEXT NOT NULL,
    "scope_type" VARCHAR(24) NOT NULL,
    "scope_id" TEXT NOT NULL,
    "baseline_window_days" INTEGER NOT NULL DEFAULT 14,
    "outcome_window_days" INTEGER NOT NULL DEFAULT 7,
    "observed_revenue" DOUBLE PRECISION,
    "observed_occupancy" DOUBLE PRECISION,
    "observed_bookings" INTEGER,
    "observed_adr" DOUBLE PRECISION,
    "observed_revpar" DOUBLE PRECISION,
    "expected_revenue" DOUBLE PRECISION,
    "expected_occupancy" DOUBLE PRECISION,
    "expected_bookings" DOUBLE PRECISION,
    "expected_adr" DOUBLE PRECISION,
    "expected_revpar" DOUBLE PRECISION,
    "uplift_revenue" DOUBLE PRECISION,
    "uplift_occupancy" DOUBLE PRECISION,
    "uplift_bookings" DOUBLE PRECISION,
    "uplift_adr" DOUBLE PRECISION,
    "uplift_revpar" DOUBLE PRECISION,
    "uplift_score" DOUBLE PRECISION,
    "confidence_score" DOUBLE PRECISION,
    "estimate_method" VARCHAR(32),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "counterfactual_evaluations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "counterfactual_evaluations_action_id_key" ON "counterfactual_evaluations"("action_id");

CREATE INDEX IF NOT EXISTS "counterfactual_evaluations_scope_type_scope_id_created_at_idx"
ON "counterfactual_evaluations"("scope_type", "scope_id", "created_at");

ALTER TABLE "counterfactual_evaluations"
ADD CONSTRAINT "counterfactual_evaluations_action_id_fkey"
FOREIGN KEY ("action_id") REFERENCES "autonomy_actions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "autonomy_outcomes"
ADD CONSTRAINT "autonomy_outcomes_counterfactual_eval_id_fkey"
FOREIGN KEY ("counterfactual_eval_id") REFERENCES "counterfactual_evaluations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "counterfactual_match_logs" (
    "id" TEXT NOT NULL,
    "action_id" TEXT NOT NULL,
    "feature_key" VARCHAR(48) NOT NULL,
    "feature_value" VARCHAR(64) NOT NULL,
    "matched_count" INTEGER NOT NULL DEFAULT 0,
    "average_reward" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "counterfactual_match_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "counterfactual_match_logs_action_id_created_at_idx"
ON "counterfactual_match_logs"("action_id", "created_at");

CREATE TABLE IF NOT EXISTS "uplift_learning_logs" (
    "id" TEXT NOT NULL,
    "action_id" TEXT,
    "scope_type" VARCHAR(24) NOT NULL,
    "scope_id" TEXT NOT NULL,
    "event_type" VARCHAR(32) NOT NULL,
    "message" TEXT,
    "meta" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "uplift_learning_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "uplift_learning_logs_scope_type_scope_id_created_at_idx"
ON "uplift_learning_logs"("scope_type", "scope_id", "created_at");
