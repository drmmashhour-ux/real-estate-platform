-- BNHub autonomy: deterministic self-learning loop (outcomes, rule weights, audit logs).

-- AlterTable
ALTER TABLE "autonomy_configs" ADD COLUMN "learning_window_days" INTEGER DEFAULT 7;

-- AlterTable
ALTER TABLE "autonomy_actions" ADD COLUMN "signal_key" VARCHAR(48),
ADD COLUMN "baseline_metrics_json" JSONB,
ADD COLUMN "learning_eligible" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "autonomy_outcomes" (
    "id" TEXT NOT NULL,
    "action_id" TEXT NOT NULL,
    "scope_type" VARCHAR(24) NOT NULL,
    "scope_id" TEXT NOT NULL,
    "evaluated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "baseline_revenue" DOUBLE PRECISION,
    "baseline_occupancy" DOUBLE PRECISION,
    "baseline_bookings" INTEGER,
    "baseline_adr" DOUBLE PRECISION,
    "baseline_revpar" DOUBLE PRECISION,
    "observed_revenue" DOUBLE PRECISION,
    "observed_occupancy" DOUBLE PRECISION,
    "observed_bookings" INTEGER,
    "observed_adr" DOUBLE PRECISION,
    "observed_revpar" DOUBLE PRECISION,
    "revenue_delta" DOUBLE PRECISION,
    "occupancy_delta" DOUBLE PRECISION,
    "booking_delta" DOUBLE PRECISION,
    "adr_delta" DOUBLE PRECISION,
    "revpar_delta" DOUBLE PRECISION,
    "reward_score" DOUBLE PRECISION,
    "outcome_label" VARCHAR(24),
    "outcome_window_days" INTEGER NOT NULL DEFAULT 7,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "autonomy_outcomes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "autonomy_rule_weights" (
    "id" TEXT NOT NULL,
    "scope_type" VARCHAR(24) NOT NULL,
    "scope_id" TEXT NOT NULL,
    "domain" VARCHAR(32) NOT NULL,
    "signal_key" VARCHAR(48) NOT NULL,
    "action_type" VARCHAR(48) NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "success_count" INTEGER NOT NULL DEFAULT 0,
    "failure_count" INTEGER NOT NULL DEFAULT 0,
    "total_reward" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "last_outcome_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "autonomy_rule_weights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "autonomy_learning_logs" (
    "id" TEXT NOT NULL,
    "scope_type" VARCHAR(24) NOT NULL,
    "scope_id" TEXT NOT NULL,
    "action_id" TEXT,
    "rule_weight_id" TEXT,
    "event_type" VARCHAR(32) NOT NULL,
    "message" TEXT,
    "meta" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "autonomy_learning_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "autonomy_outcomes_action_id_key" ON "autonomy_outcomes"("action_id");

-- CreateIndex
CREATE INDEX "autonomy_outcomes_scope_type_scope_id_created_at_idx" ON "autonomy_outcomes"("scope_type", "scope_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "autonomy_rule_weights_scope_type_scope_id_domain_signal_key_action_type_key" ON "autonomy_rule_weights"("scope_type", "scope_id", "domain", "signal_key", "action_type");

-- CreateIndex
CREATE INDEX "autonomy_rule_weights_scope_type_scope_id_idx" ON "autonomy_rule_weights"("scope_type", "scope_id");

-- CreateIndex
CREATE INDEX "autonomy_learning_logs_scope_type_scope_id_created_at_idx" ON "autonomy_learning_logs"("scope_type", "scope_id", "created_at");

-- AddForeignKey
ALTER TABLE "autonomy_outcomes" ADD CONSTRAINT "autonomy_outcomes_action_id_fkey" FOREIGN KEY ("action_id") REFERENCES "autonomy_actions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
