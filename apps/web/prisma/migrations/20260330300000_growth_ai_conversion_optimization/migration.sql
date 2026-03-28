-- Conversion optimization: AI/human activity timestamps, assist-close flag, stale marker, worker indexes.

ALTER TABLE "growth_ai_conversations"
  ADD COLUMN "last_ai_message_at" TIMESTAMP(3),
  ADD COLUMN "last_human_message_at" TIMESTAMP(3),
  ADD COLUMN "stale_marked_at" TIMESTAMP(3);

ALTER TABLE "growth_ai_conversation_messages"
  ADD COLUMN "is_assist_close" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "growth_ai_conversations_last_user_message_at_idx" ON "growth_ai_conversations" ("last_user_message_at");
CREATE INDEX "growth_ai_conversations_silent_nudge_sent_at_idx" ON "growth_ai_conversations" ("silent_nudge_sent_at");

ALTER TABLE "growth_ai_conversations" ALTER COLUMN "outcome" TYPE VARCHAR(32);
ALTER TABLE "growth_ai_conversation_messages" ALTER COLUMN "cta_type" TYPE VARCHAR(32);
