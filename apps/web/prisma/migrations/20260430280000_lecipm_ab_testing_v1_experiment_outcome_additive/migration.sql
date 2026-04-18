-- LECIPM Autonomous A/B Testing V1 — additive only (Postgres).

DO $enum$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'ExperimentStatus' AND e.enumlabel = 'archived'
  ) THEN
    ALTER TYPE "ExperimentStatus" ADD VALUE 'archived';
  END IF;
END $enum$;

ALTER TABLE "experiments" ADD COLUMN IF NOT EXISTS "objective" TEXT;
ALTER TABLE "experiments" ADD COLUMN IF NOT EXISTS "metric_secondary" JSONB;
ALTER TABLE "experiments" ADD COLUMN IF NOT EXISTS "audience_scope" JSONB;
ALTER TABLE "experiments" ADD COLUMN IF NOT EXISTS "notes" JSONB;

ALTER TABLE "experiment_variants" ADD COLUMN IF NOT EXISTS "outcome_status" VARCHAR(24);
ALTER TABLE "experiment_variants" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS "experiment_outcome_decisions" (
    "id" TEXT NOT NULL,
    "experiment_id" TEXT NOT NULL,
    "decision_type" VARCHAR(32) NOT NULL,
    "winning_variant_id" TEXT,
    "losing_variant_ids" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "rationale" JSONB NOT NULL,
    "recommendation" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "experiment_outcome_decisions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "experiment_outcome_decisions_experiment_id_created_at_idx" ON "experiment_outcome_decisions"("experiment_id", "created_at");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'experiment_outcome_decisions_experiment_id_fkey'
  ) THEN
    ALTER TABLE "experiment_outcome_decisions" ADD CONSTRAINT "experiment_outcome_decisions_experiment_id_fkey"
      FOREIGN KEY ("experiment_id") REFERENCES "experiments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'experiment_outcome_decisions_winning_variant_id_fkey'
  ) THEN
    ALTER TABLE "experiment_outcome_decisions" ADD CONSTRAINT "experiment_outcome_decisions_winning_variant_id_fkey"
      FOREIGN KEY ("winning_variant_id") REFERENCES "experiment_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
