-- LECIPM Manager AI operations layer

CREATE TABLE "manager_ai_conversations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT,
    "context_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "manager_ai_conversations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "manager_ai_messages" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "manager_ai_messages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "manager_ai_agent_runs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "actor_user_id" TEXT,
    "agent_key" TEXT NOT NULL,
    "decision_mode" TEXT NOT NULL,
    "input_summary" TEXT NOT NULL,
    "output_summary" TEXT,
    "confidence" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "payload" JSONB,
    "result" JSONB,
    "error" JSONB,
    "target_entity_type" TEXT,
    "target_entity_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "manager_ai_agent_runs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "manager_ai_action_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "action_key" TEXT NOT NULL,
    "target_entity_type" TEXT NOT NULL,
    "target_entity_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'executed',
    "decision_mode" TEXT,
    "confidence" DOUBLE PRECISION,
    "payload" JSONB,
    "result" JSONB,
    "error" JSONB,
    "approval_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "manager_ai_action_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "manager_ai_recommendations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "agent_key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION,
    "target_entity_type" TEXT NOT NULL,
    "target_entity_id" TEXT NOT NULL,
    "suggested_action" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "manager_ai_recommendations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "manager_ai_approval_requests" (
    "id" TEXT NOT NULL,
    "requester_id" TEXT NOT NULL,
    "reviewer_id" TEXT,
    "action_key" TEXT NOT NULL,
    "target_entity_type" TEXT NOT NULL,
    "target_entity_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "confidence" DOUBLE PRECISION,
    "payload" JSONB,
    "result" JSONB,
    "review_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "reviewed_at" TIMESTAMP(3),

    CONSTRAINT "manager_ai_approval_requests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "manager_ai_automation_rules" (
    "id" TEXT NOT NULL,
    "rule_key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "frequency" TEXT NOT NULL DEFAULT 'on_demand',
    "last_run_at" TIMESTAMP(3),
    "next_run_at" TIMESTAMP(3),
    "config" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "manager_ai_automation_rules_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "manager_ai_automation_rules_rule_key_key" ON "manager_ai_automation_rules"("rule_key");

CREATE TABLE "manager_ai_notification_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "channel" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "manager_ai_notification_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "manager_ai_platform_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "global_mode" TEXT NOT NULL DEFAULT 'ASSISTANT',
    "automations_enabled" BOOLEAN NOT NULL DEFAULT true,
    "agent_modes_json" JSONB,
    "notify_on_approval" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "manager_ai_platform_settings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "manager_ai_platform_settings" ("id", "global_mode", "automations_enabled", "notify_on_approval", "updated_at")
VALUES ('default', 'ASSISTANT', true, true, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

ALTER TABLE "manager_ai_conversations" ADD CONSTRAINT "manager_ai_conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "manager_ai_messages" ADD CONSTRAINT "manager_ai_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "manager_ai_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "manager_ai_agent_runs" ADD CONSTRAINT "manager_ai_agent_runs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "manager_ai_action_logs" ADD CONSTRAINT "manager_ai_action_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "manager_ai_recommendations" ADD CONSTRAINT "manager_ai_recommendations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "manager_ai_approval_requests" ADD CONSTRAINT "manager_ai_approval_requests_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "manager_ai_approval_requests" ADD CONSTRAINT "manager_ai_approval_requests_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "manager_ai_notification_logs" ADD CONSTRAINT "manager_ai_notification_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "manager_ai_conversations_user_id_updated_at_idx" ON "manager_ai_conversations"("user_id", "updated_at");
CREATE INDEX "manager_ai_messages_conversation_id_created_at_idx" ON "manager_ai_messages"("conversation_id", "created_at");
CREATE INDEX "manager_ai_agent_runs_user_id_created_at_idx" ON "manager_ai_agent_runs"("user_id", "created_at");
CREATE INDEX "manager_ai_agent_runs_agent_key_created_at_idx" ON "manager_ai_agent_runs"("agent_key", "created_at");
CREATE INDEX "manager_ai_action_logs_action_key_created_at_idx" ON "manager_ai_action_logs"("action_key", "created_at");
CREATE INDEX "manager_ai_action_logs_target_entity_type_target_entity_id_idx" ON "manager_ai_action_logs"("target_entity_type", "target_entity_id");
CREATE INDEX "manager_ai_recommendations_user_id_status_idx" ON "manager_ai_recommendations"("user_id", "status");
CREATE INDEX "manager_ai_recommendations_created_at_idx" ON "manager_ai_recommendations"("created_at");
CREATE INDEX "manager_ai_approval_requests_status_created_at_idx" ON "manager_ai_approval_requests"("status", "created_at");
CREATE INDEX "manager_ai_approval_requests_requester_id_idx" ON "manager_ai_approval_requests"("requester_id");
CREATE INDEX "manager_ai_notification_logs_user_id_created_at_idx" ON "manager_ai_notification_logs"("user_id", "created_at");
