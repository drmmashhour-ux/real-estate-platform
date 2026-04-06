-- Growth AI auto-reply (LECIPM + BNHub). Separate from CRM `conversations` table.

CREATE TABLE "growth_ai_conversations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "channel" TEXT NOT NULL DEFAULT 'in_app',
    "status" TEXT NOT NULL DEFAULT 'open',
    "assigned_to_id" TEXT,
    "context_json" JSONB,
    "human_takeover_at" TIMESTAMP(3),
    "ai_reply_pending" BOOLEAN NOT NULL DEFAULT false,
    "last_automated_at" TIMESTAMP(3),
    "silent_nudge_sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "growth_ai_conversations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "growth_ai_conversations_user_id_status_idx" ON "growth_ai_conversations"("user_id", "status");
CREATE INDEX "growth_ai_conversations_status_ai_reply_pending_idx" ON "growth_ai_conversations"("status", "ai_reply_pending");
CREATE INDEX "growth_ai_conversations_assigned_to_id_idx" ON "growth_ai_conversations"("assigned_to_id");

ALTER TABLE "growth_ai_conversations" ADD CONSTRAINT "growth_ai_conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "growth_ai_conversations" ADD CONSTRAINT "growth_ai_conversations_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "growth_ai_conversation_messages" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "sender_type" TEXT NOT NULL,
    "message_text" TEXT NOT NULL,
    "detected_intent" TEXT,
    "detected_objection" TEXT,
    "confidence" DOUBLE PRECISION,
    "handoff_required" BOOLEAN NOT NULL DEFAULT false,
    "template_key" TEXT,
    "cta_type" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "growth_ai_conversation_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "growth_ai_conversation_messages_conversation_id_created_at_idx" ON "growth_ai_conversation_messages"("conversation_id", "created_at");

ALTER TABLE "growth_ai_conversation_messages" ADD CONSTRAINT "growth_ai_conversation_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "growth_ai_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "auto_reply_rules" (
    "id" TEXT NOT NULL,
    "intent" TEXT NOT NULL,
    "objection" TEXT,
    "stage" TEXT,
    "template_key" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auto_reply_rules_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "auto_reply_rules_intent_objection_is_active_idx" ON "auto_reply_rules"("intent", "objection", "is_active");

CREATE TABLE "auto_reply_templates" (
    "id" TEXT NOT NULL,
    "template_key" TEXT NOT NULL,
    "segment" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "cta_type" TEXT NOT NULL,
    "tone" TEXT NOT NULL DEFAULT 'helpful',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auto_reply_templates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "auto_reply_templates_template_key_key" ON "auto_reply_templates"("template_key");

CREATE TABLE "growth_ai_conversation_handoffs" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "growth_ai_conversation_handoffs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "growth_ai_conversation_handoffs_conversation_id_status_idx" ON "growth_ai_conversation_handoffs"("conversation_id", "status");

ALTER TABLE "growth_ai_conversation_handoffs" ADD CONSTRAINT "growth_ai_conversation_handoffs_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "growth_ai_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
