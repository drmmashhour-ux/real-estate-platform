-- Bounded growth autonomy learning loop (ordering/suppression metadata only).

CREATE TABLE "growth_autonomy_learning_state" (
    "id" TEXT NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "weight_deltas_by_category" JSONB NOT NULL DEFAULT '{}',
    "suppressed_until_by_category" JSONB NOT NULL DEFAULT '{}',
    "aggregates_by_category" JSONB NOT NULL DEFAULT '{}',
    "control_flags" JSONB NOT NULL DEFAULT '{}',
    "last_learning_run_at" TIMESTAMPTZ(6),

    CONSTRAINT "growth_autonomy_learning_state_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "growth_autonomy_learning_records" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "suggestion_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "target_key" TEXT NOT NULL,
    "operator_user_id" TEXT,
    "interaction_kind" TEXT NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "growth_autonomy_learning_records_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_ga_learning_cat_time" ON "growth_autonomy_learning_records"("category_id", "created_at");
CREATE INDEX "idx_ga_learning_time" ON "growth_autonomy_learning_records"("created_at");
