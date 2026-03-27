-- ImmoContact / AI CRM chat threads
CREATE TABLE "crm_conversations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "guest_session_id" TEXT,
    "expert_id" TEXT,
    "lead_id" TEXT,
    "metadata" JSONB,
    "expert_last_read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_conversations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "crm_conversations_lead_id_key" ON "crm_conversations"("lead_id");

CREATE INDEX "crm_conversations_user_id_idx" ON "crm_conversations"("user_id");

CREATE INDEX "crm_conversations_guest_session_id_idx" ON "crm_conversations"("guest_session_id");

CREATE INDEX "crm_conversations_expert_id_idx" ON "crm_conversations"("expert_id");

CREATE INDEX "crm_conversations_updated_at_idx" ON "crm_conversations"("updated_at");

ALTER TABLE "crm_conversations" ADD CONSTRAINT "crm_conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "crm_conversations" ADD CONSTRAINT "crm_conversations_expert_id_fkey" FOREIGN KEY ("expert_id") REFERENCES "mortgage_experts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "crm_conversations" ADD CONSTRAINT "crm_conversations_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "crm_messages" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "crm_messages_conversation_id_created_at_idx" ON "crm_messages"("conversation_id", "created_at");

ALTER TABLE "crm_messages" ADD CONSTRAINT "crm_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "crm_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
