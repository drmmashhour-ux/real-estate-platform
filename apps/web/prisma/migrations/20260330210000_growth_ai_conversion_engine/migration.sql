-- Conversion-level outcomes, high-intent flags, user activity timestamps, nudge markers.

ALTER TABLE "growth_ai_conversations"
  ADD COLUMN "outcome" TEXT,
  ADD COLUMN "high_intent" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "last_user_message_at" TIMESTAMP(3),
  ADD COLUMN "high_intent_assist_nudge_sent_at" TIMESTAMP(3);

UPDATE "growth_ai_conversations"
SET "outcome" = 'new'
WHERE "outcome" IS NULL AND "status" = 'open';

ALTER TABLE "growth_ai_conversation_messages"
  ADD COLUMN "is_nudge" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "growth_ai_conversations_outcome_idx" ON "growth_ai_conversations" ("outcome");
CREATE INDEX "growth_ai_conversations_high_intent_idx" ON "growth_ai_conversations" ("high_intent");
