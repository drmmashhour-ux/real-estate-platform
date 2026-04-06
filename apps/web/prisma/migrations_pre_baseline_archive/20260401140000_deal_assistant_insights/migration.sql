-- Deal Assistant: persisted analysis snapshots for growth AI conversations (human-in-the-loop).

CREATE TABLE "deal_assistant_insights" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "detected_intent" TEXT NOT NULL,
    "detected_objection" TEXT NOT NULL,
    "urgency_level" TEXT NOT NULL,
    "recommended_action" TEXT NOT NULL,
    "message_suggestion" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deal_assistant_insights_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "deal_assistant_insights_conversation_id_created_at_idx" ON "deal_assistant_insights"("conversation_id", "created_at");

ALTER TABLE "deal_assistant_insights" ADD CONSTRAINT "deal_assistant_insights_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "growth_ai_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
