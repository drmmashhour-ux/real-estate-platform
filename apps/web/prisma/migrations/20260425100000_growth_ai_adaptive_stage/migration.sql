-- Adaptive conversion funnel stage (separate from outcome).
ALTER TABLE "growth_ai_conversations" ADD COLUMN "stage" VARCHAR(24) NOT NULL DEFAULT 'new';

CREATE INDEX "growth_ai_conversations_stage_idx" ON "growth_ai_conversations" ("stage");
