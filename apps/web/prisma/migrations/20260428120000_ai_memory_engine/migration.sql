-- LECIPM AiMemoryEngine

CREATE TABLE "ai_memory_examples" (
    "id" TEXT NOT NULL,
    "draft_id" TEXT NOT NULL,
    "form_key" TEXT NOT NULL,
    "user_id" TEXT,
    "input_json" JSONB NOT NULL,
    "ai_output_json" JSONB NOT NULL,
    "final_output_json" JSONB NOT NULL,
    "diff_json" JSONB,
    "outcome" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_memory_examples_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ai_correction_patterns" (
    "id" TEXT NOT NULL,
    "form_key" TEXT,
    "finding_key" TEXT NOT NULL,
    "pattern_key" TEXT NOT NULL,
    "original_text" TEXT NOT NULL,
    "corrected_text" TEXT NOT NULL,
    "frequency" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_correction_patterns_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ai_user_preferences" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "preference_key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_user_preferences_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ai_memory_examples_draft_id_idx" ON "ai_memory_examples"("draft_id");
CREATE INDEX "ai_memory_examples_form_key_idx" ON "ai_memory_examples"("form_key");
CREATE INDEX "ai_memory_examples_outcome_idx" ON "ai_memory_examples"("outcome");

CREATE UNIQUE INDEX "ai_correction_patterns_pattern_key_key" ON "ai_correction_patterns"("pattern_key");
CREATE INDEX "ai_correction_patterns_form_key_idx" ON "ai_correction_patterns"("form_key");
CREATE INDEX "ai_correction_patterns_finding_key_idx" ON "ai_correction_patterns"("finding_key");

CREATE UNIQUE INDEX "ai_user_preferences_user_id_preference_key_key" ON "ai_user_preferences"("user_id", "preference_key");
CREATE INDEX "ai_user_preferences_user_id_idx" ON "ai_user_preferences"("user_id");
