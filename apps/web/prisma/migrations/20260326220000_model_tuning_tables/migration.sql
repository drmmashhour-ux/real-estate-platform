-- Internal LECIPM model tuning profiles & simulation comparisons

CREATE TABLE "tuning_profiles" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "based_on_validation_run_id" TEXT,
    "config" JSONB NOT NULL,
    "created_by" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "applied_at" TIMESTAMPTZ(6),
    "applied_by" TEXT,
    "supersedes_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "tuning_profiles_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "tuning_profiles_created_at_idx" ON "tuning_profiles"("created_at");
CREATE INDEX "tuning_profiles_based_on_validation_run_id_idx" ON "tuning_profiles"("based_on_validation_run_id");
CREATE INDEX "tuning_profiles_is_active_idx" ON "tuning_profiles"("is_active");

CREATE TABLE "tuning_comparisons" (
    "id" TEXT NOT NULL,
    "tuning_profile_id" TEXT NOT NULL,
    "validation_run_id" TEXT NOT NULL,
    "before_metrics" JSONB NOT NULL,
    "after_metrics" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tuning_comparisons_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "tuning_comparisons_tuning_profile_id_idx" ON "tuning_comparisons"("tuning_profile_id");
CREATE INDEX "tuning_comparisons_validation_run_id_idx" ON "tuning_comparisons"("validation_run_id");

ALTER TABLE "tuning_comparisons" ADD CONSTRAINT "tuning_comparisons_tuning_profile_id_fkey" FOREIGN KEY ("tuning_profile_id") REFERENCES "tuning_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
