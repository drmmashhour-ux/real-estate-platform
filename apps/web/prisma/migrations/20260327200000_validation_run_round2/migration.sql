-- Round-2 validation: run kind, tuning profile link, comparisons table.

CREATE TYPE "ModelValidationRunKind" AS ENUM ('baseline', 'tuned_same_set', 'tuned_fresh_set');

ALTER TABLE "model_validation_runs"
  ADD COLUMN "validation_run_kind" "ModelValidationRunKind" NOT NULL DEFAULT 'baseline',
  ADD COLUMN "applied_tuning_profile_id" TEXT,
  ADD COLUMN "comparison_target_run_id" TEXT;

CREATE INDEX "model_validation_runs_validation_run_kind_idx" ON "model_validation_runs"("validation_run_kind");
CREATE INDEX "model_validation_runs_comparison_target_run_id_idx" ON "model_validation_runs"("comparison_target_run_id");
CREATE INDEX "model_validation_runs_applied_tuning_profile_id_idx" ON "model_validation_runs"("applied_tuning_profile_id");

ALTER TABLE "model_validation_runs"
  ADD CONSTRAINT "model_validation_runs_applied_tuning_profile_id_fkey"
    FOREIGN KEY ("applied_tuning_profile_id") REFERENCES "tuning_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "model_validation_runs"
  ADD CONSTRAINT "model_validation_runs_comparison_target_run_id_fkey"
    FOREIGN KEY ("comparison_target_run_id") REFERENCES "model_validation_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "validation_run_comparisons" (
    "id" TEXT NOT NULL,
    "base_run_id" TEXT NOT NULL,
    "comparison_run_id" TEXT NOT NULL,
    "metrics_delta" JSONB NOT NULL,
    "summary" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "validation_run_comparisons_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uq_validation_run_comparison_pair" ON "validation_run_comparisons"("base_run_id", "comparison_run_id");
CREATE INDEX "validation_run_comparisons_base_run_id_idx" ON "validation_run_comparisons"("base_run_id");
CREATE INDEX "validation_run_comparisons_comparison_run_id_idx" ON "validation_run_comparisons"("comparison_run_id");

ALTER TABLE "validation_run_comparisons"
  ADD CONSTRAINT "validation_run_comparisons_base_run_id_fkey"
    FOREIGN KEY ("base_run_id") REFERENCES "model_validation_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "validation_run_comparisons"
  ADD CONSTRAINT "validation_run_comparisons_comparison_run_id_fkey"
    FOREIGN KEY ("comparison_run_id") REFERENCES "model_validation_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
