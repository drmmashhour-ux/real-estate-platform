-- Outcome tracking for growth AI auto-reply + silent nudge analytics.

ALTER TABLE "growth_ai_conversations" ADD COLUMN "growth_ai_outcome" TEXT;
ALTER TABLE "growth_ai_conversations" ADD COLUMN "growth_ai_outcome_at" TIMESTAMP(3);

CREATE INDEX "growth_ai_conversations_growth_ai_outcome_idx" ON "growth_ai_conversations"("growth_ai_outcome");
