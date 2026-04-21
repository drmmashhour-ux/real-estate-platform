-- BNHub / LECIPM self-evolving loop (human-gated policy changes)

CREATE TABLE "evolution_outcome_events" (
    "id" TEXT NOT NULL,
    "domain" VARCHAR(16) NOT NULL,
    "metric_type" VARCHAR(32) NOT NULL,
    "strategy_key" VARCHAR(128),
    "experiment_key" VARCHAR(128),
    "entity_type" VARCHAR(48),
    "entity_id" VARCHAR(64),
    "expected_json" JSONB,
    "actual_json" JSONB,
    "variance_score" DOUBLE PRECISION,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evolution_outcome_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "evolution_safe_experiments" (
    "id" TEXT NOT NULL,
    "experiment_key" VARCHAR(128) NOT NULL,
    "name" VARCHAR(256) NOT NULL,
    "domain" VARCHAR(16) NOT NULL,
    "status" VARCHAR(24) NOT NULL DEFAULT 'DRAFT',
    "arms_json" JSONB NOT NULL,
    "traffic_cap_percent" INTEGER NOT NULL DEFAULT 10,
    "requires_human_approval" BOOLEAN NOT NULL DEFAULT true,
    "approved_by_user_id" TEXT,
    "approved_at" TIMESTAMP(3),
    "created_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evolution_safe_experiments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "evolution_safe_experiments_experiment_key_key" ON "evolution_safe_experiments"("experiment_key");

CREATE TABLE "evolution_strategy_memory" (
    "id" TEXT NOT NULL,
    "domain" VARCHAR(16) NOT NULL,
    "strategy_key" VARCHAR(128) NOT NULL,
    "reinforcement_score" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "success_count" INTEGER NOT NULL DEFAULT 0,
    "failure_count" INTEGER NOT NULL DEFAULT 0,
    "last_outcome_at" TIMESTAMP(3),
    "calibration_json" JSONB,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evolution_strategy_memory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "evolution_strategy_memory_domain_strategy_key_key" ON "evolution_strategy_memory"("domain", "strategy_key");

CREATE TABLE "evolution_policy_adjustments" (
    "id" TEXT NOT NULL,
    "domain" VARCHAR(16) NOT NULL,
    "kind" VARCHAR(32) NOT NULL,
    "payload_json" JSONB NOT NULL,
    "rationale" TEXT,
    "status" VARCHAR(16) NOT NULL DEFAULT 'PENDING',
    "proposed_by_source" VARCHAR(32) NOT NULL DEFAULT 'REINFORCEMENT_ENGINE',
    "reviewed_by_user_id" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evolution_policy_adjustments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "evolution_outcome_events_domain_metric_type_created_at_idx" ON "evolution_outcome_events"("domain", "metric_type", "created_at" DESC);
CREATE INDEX "evolution_outcome_events_strategy_key_idx" ON "evolution_outcome_events"("strategy_key");
CREATE INDEX "evolution_outcome_events_experiment_key_idx" ON "evolution_outcome_events"("experiment_key");
CREATE INDEX "evolution_safe_experiments_domain_status_idx" ON "evolution_safe_experiments"("domain", "status");
CREATE INDEX "evolution_strategy_memory_domain_reinforcement_score_idx" ON "evolution_strategy_memory"("domain", "reinforcement_score");
CREATE INDEX "evolution_policy_adjustments_status_created_at_idx" ON "evolution_policy_adjustments"("status", "created_at" DESC);

ALTER TABLE "evolution_safe_experiments" ADD CONSTRAINT "evolution_safe_experiments_approved_by_user_id_fkey" FOREIGN KEY ("approved_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "evolution_safe_experiments" ADD CONSTRAINT "evolution_safe_experiments_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "evolution_policy_adjustments" ADD CONSTRAINT "evolution_policy_adjustments_reviewed_by_user_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
