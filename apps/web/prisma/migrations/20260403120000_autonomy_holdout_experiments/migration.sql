-- BNHub autonomy: deterministic holdout experiments (control vs treatment). Distinct from global `experiments` table.

CREATE TABLE "autonomy_experiments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "scope_type" VARCHAR(24) NOT NULL,
    "scope_id" TEXT NOT NULL,
    "domain" VARCHAR(32) NOT NULL,
    "signal_key" VARCHAR(48) NOT NULL,
    "action_type" VARCHAR(48) NOT NULL,
    "status" VARCHAR(24) NOT NULL,
    "traffic_split" DOUBLE PRECISION NOT NULL DEFAULT 0.15,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "autonomy_experiments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "autonomy_experiments_scope_type_scope_id_status_idx" ON "autonomy_experiments"("scope_type", "scope_id", "status");
CREATE INDEX "autonomy_experiments_scope_domain_signal_action_status_idx"
  ON "autonomy_experiments"("scope_type", "scope_id", "domain", "signal_key", "action_type", "status");

CREATE TABLE "autonomy_experiment_assignments" (
    "id" TEXT NOT NULL,
    "experiment_id" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "group" VARCHAR(16) NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "autonomy_experiment_assignments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "autonomy_experiment_assignments_experiment_id_entity_id_key"
  ON "autonomy_experiment_assignments"("experiment_id", "entity_id");
CREATE INDEX "autonomy_experiment_assignments_experiment_id_idx"
  ON "autonomy_experiment_assignments"("experiment_id");

ALTER TABLE "autonomy_experiment_assignments"
  ADD CONSTRAINT "autonomy_experiment_assignments_experiment_id_fkey"
  FOREIGN KEY ("experiment_id") REFERENCES "autonomy_experiments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "autonomy_experiment_outcomes" (
    "id" TEXT NOT NULL,
    "experiment_id" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "group" VARCHAR(16) NOT NULL,
    "revenue" DOUBLE PRECISION NOT NULL,
    "occupancy" DOUBLE PRECISION NOT NULL,
    "bookings" INTEGER NOT NULL,
    "adr" DOUBLE PRECISION NOT NULL,
    "revpar" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "autonomy_experiment_outcomes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "autonomy_experiment_outcomes_experiment_id_created_at_idx"
  ON "autonomy_experiment_outcomes"("experiment_id", "created_at");

ALTER TABLE "autonomy_experiment_outcomes"
  ADD CONSTRAINT "autonomy_experiment_outcomes_experiment_id_fkey"
  FOREIGN KEY ("experiment_id") REFERENCES "autonomy_experiments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "autonomy_experiment_results" (
    "id" TEXT NOT NULL,
    "experiment_id" TEXT NOT NULL,
    "treatment_revenue" DOUBLE PRECISION NOT NULL,
    "control_revenue" DOUBLE PRECISION NOT NULL,
    "uplift_revenue" DOUBLE PRECISION NOT NULL,
    "treatment_bookings" DOUBLE PRECISION NOT NULL,
    "control_bookings" DOUBLE PRECISION NOT NULL,
    "uplift_bookings" DOUBLE PRECISION NOT NULL,
    "confidence_score" DOUBLE PRECISION NOT NULL,
    "sample_size" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "autonomy_experiment_results_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "autonomy_experiment_results_experiment_id_created_at_idx"
  ON "autonomy_experiment_results"("experiment_id", "created_at");

ALTER TABLE "autonomy_experiment_results"
  ADD CONSTRAINT "autonomy_experiment_results_experiment_id_fkey"
  FOREIGN KEY ("experiment_id") REFERENCES "autonomy_experiments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
