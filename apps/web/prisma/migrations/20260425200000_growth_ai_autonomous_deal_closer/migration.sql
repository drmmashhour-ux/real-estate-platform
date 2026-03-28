-- Autonomous deal closer: orchestration, action log, assignment rules.

CREATE TABLE "growth_ai_lead_orchestrations" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "user_id" TEXT,
    "listing_id" TEXT,
    "booking_id" TEXT,
    "route_type" VARCHAR(32),
    "lead_score" INTEGER NOT NULL DEFAULT 0,
    "urgency_score" INTEGER NOT NULL DEFAULT 0,
    "assignment_status" VARCHAR(32) NOT NULL DEFAULT 'unassigned',
    "assigned_broker_id" TEXT,
    "assigned_host_id" TEXT,
    "assigned_admin_id" TEXT,
    "next_action_type" VARCHAR(32),
    "next_action_due_at" TIMESTAMP(3),
    "last_action_at" TIMESTAMP(3),
    "conversion_goal" VARCHAR(32),
    "automation_paused" BOOLEAN NOT NULL DEFAULT false,
    "assigned_at" TIMESTAMP(3),
    "last_orchestration_template_key" VARCHAR(64),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "growth_ai_lead_orchestrations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "growth_ai_lead_orchestrations_conversation_id_key" ON "growth_ai_lead_orchestrations"("conversation_id");

CREATE INDEX "growth_ai_lead_orchestrations_conversation_id_idx" ON "growth_ai_lead_orchestrations"("conversation_id");

CREATE INDEX "growth_ai_lead_orchestrations_assignment_status_next_action_due_at_idx" ON "growth_ai_lead_orchestrations"("assignment_status", "next_action_due_at");

CREATE INDEX "growth_ai_lead_orchestrations_assigned_broker_id_idx" ON "growth_ai_lead_orchestrations"("assigned_broker_id");

CREATE INDEX "growth_ai_lead_orchestrations_assigned_host_id_idx" ON "growth_ai_lead_orchestrations"("assigned_host_id");

ALTER TABLE "growth_ai_lead_orchestrations" ADD CONSTRAINT "growth_ai_lead_orchestrations_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "growth_ai_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "growth_ai_action_logs" (
    "id" TEXT NOT NULL,
    "orchestration_id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "action_type" TEXT NOT NULL,
    "action_payload" JSONB,
    "result_status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "growth_ai_action_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "growth_ai_action_logs_orchestration_id_idx" ON "growth_ai_action_logs"("orchestration_id");

CREATE INDEX "growth_ai_action_logs_conversation_id_idx" ON "growth_ai_action_logs"("conversation_id");

ALTER TABLE "growth_ai_action_logs" ADD CONSTRAINT "growth_ai_action_logs_orchestration_id_fkey" FOREIGN KEY ("orchestration_id") REFERENCES "growth_ai_lead_orchestrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "growth_ai_assignment_rules" (
    "id" TEXT NOT NULL,
    "route_type" VARCHAR(32) NOT NULL,
    "city" VARCHAR(64),
    "property_type" VARCHAR(32),
    "broker_id" TEXT,
    "host_id" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "growth_ai_assignment_rules_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "growth_ai_assignment_rules_route_type_is_active_idx" ON "growth_ai_assignment_rules"("route_type", "is_active");
