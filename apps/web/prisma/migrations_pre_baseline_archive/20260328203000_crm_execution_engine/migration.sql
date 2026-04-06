-- LECIPM CRM execution layer: scoring + priority + close pipeline stage
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "crm_intent_score" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "crm_urgency_score" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "crm_trust_score" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "crm_friction_score" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "crm_last_activity_at" TIMESTAMP(3);
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "crm_next_best_action" TEXT;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "crm_priority_score" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "crm_execution_stage" TEXT NOT NULL DEFAULT 'browsing';

CREATE INDEX IF NOT EXISTS "Lead_priorityScore_lastActivityAt_idx" ON "Lead"("crm_priority_score", "crm_last_activity_at");
CREATE INDEX IF NOT EXISTS "Lead_executionStage_idx" ON "Lead"("crm_execution_stage");

ALTER TABLE "crm_conversations" ADD COLUMN IF NOT EXISTS "convo_intent_score" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "crm_conversations" ADD COLUMN IF NOT EXISTS "convo_urgency_score" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "crm_conversations" ADD COLUMN IF NOT EXISTS "convo_trust_score" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "crm_conversations" ADD COLUMN IF NOT EXISTS "convo_friction_score" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "crm_conversations" ADD COLUMN IF NOT EXISTS "convo_last_activity_at" TIMESTAMP(3);
ALTER TABLE "crm_conversations" ADD COLUMN IF NOT EXISTS "convo_next_best_action" TEXT;
ALTER TABLE "crm_conversations" ADD COLUMN IF NOT EXISTS "convo_priority_score" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS "crm_conversations_priority_last_idx" ON "crm_conversations"("convo_priority_score", "convo_last_activity_at");
