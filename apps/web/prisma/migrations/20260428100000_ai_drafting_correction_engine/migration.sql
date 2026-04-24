-- LECIPM AiDraftingCorrectionEngine persistence

CREATE TABLE "ai_draft_runs" (
    "id" TEXT NOT NULL,
    "draft_id" TEXT NOT NULL,
    "user_id" TEXT,
    "run_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "input_json" JSONB,
    "output_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_draft_runs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ai_draft_findings" (
    "id" TEXT NOT NULL,
    "draft_id" TEXT NOT NULL,
    "user_id" TEXT,
    "finding_key" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "section_key" TEXT,
    "message_fr" TEXT NOT NULL,
    "message_en" TEXT,
    "suggested_fix_fr" TEXT,
    "suggested_fix_en" TEXT,
    "blocking" BOOLEAN NOT NULL DEFAULT false,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "ai_draft_findings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ai_draft_suggestions" (
    "id" TEXT NOT NULL,
    "draft_id" TEXT NOT NULL,
    "user_id" TEXT,
    "field_key" TEXT,
    "suggestion_fr" TEXT NOT NULL,
    "suggestion_en" TEXT,
    "action_type" TEXT NOT NULL,
    "applied" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_draft_suggestions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ai_draft_runs_draft_id_idx" ON "ai_draft_runs"("draft_id");
CREATE INDEX "ai_draft_runs_user_id_idx" ON "ai_draft_runs"("user_id");
CREATE INDEX "ai_draft_runs_run_type_idx" ON "ai_draft_runs"("run_type");

CREATE INDEX "ai_draft_findings_draft_id_idx" ON "ai_draft_findings"("draft_id");
CREATE INDEX "ai_draft_findings_severity_idx" ON "ai_draft_findings"("severity");
CREATE INDEX "ai_draft_findings_blocking_idx" ON "ai_draft_findings"("blocking");

CREATE INDEX "ai_draft_suggestions_draft_id_idx" ON "ai_draft_suggestions"("draft_id");
CREATE INDEX "ai_draft_suggestions_field_key_idx" ON "ai_draft_suggestions"("field_key");
