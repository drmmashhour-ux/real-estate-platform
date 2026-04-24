-- LECIPM Autonomous Execution Engine — additive tables only

CREATE TYPE "LecipmExecutionTaskType" AS ENUM (
  'MESSAGE',
  'FOLLOW_UP',
  'DOCUMENT_PREP',
  'OFFER_PREP',
  'PRICE_UPDATE_PREP',
  'INVESTOR_PACKET_PREP',
  'NOTARY_REMINDER',
  'INVOICE_PREP',
  'DISCLOSURE_PREP',
  'DEAL_STAGE_PREP'
);

CREATE TYPE "LecipmExecutionEntityType" AS ENUM (
  'LISTING',
  'DEAL',
  'CONVERSATION',
  'PACKET',
  'INVOICE',
  'CLOSING'
);

CREATE TYPE "LecipmExecutionTaskStatus" AS ENUM (
  'DRAFT',
  'QUEUED',
  'READY_FOR_APPROVAL',
  'APPROVED',
  'EXECUTED',
  'REJECTED',
  'FAILED'
);

CREATE TYPE "LecipmExecutionRiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

CREATE TYPE "LecipmAutonomousExecutionMode" AS ENUM (
  'OFF',
  'ASSIST',
  'SAFE_AUTOMATION',
  'APPROVAL_REQUIRED'
);

CREATE TABLE "lecipm_broker_execution_settings" (
  "broker_user_id" TEXT NOT NULL,
  "mode" "LecipmAutonomousExecutionMode" NOT NULL DEFAULT 'OFF',
  "auto_paused_until" TIMESTAMP(3),
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "lecipm_broker_execution_settings_pkey" PRIMARY KEY ("broker_user_id")
);

CREATE TABLE "lecipm_execution_tasks" (
  "id" TEXT NOT NULL,
  "broker_user_id" TEXT NOT NULL,
  "task_type" "LecipmExecutionTaskType" NOT NULL,
  "entity_type" "LecipmExecutionEntityType" NOT NULL,
  "entity_id" VARCHAR(64) NOT NULL,
  "status" "LecipmExecutionTaskStatus" NOT NULL,
  "risk_level" "LecipmExecutionRiskLevel" NOT NULL,
  "priority_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "payload_json" JSONB NOT NULL,
  "ai_reasoning_json" JSONB NOT NULL,
  "idempotency_key" VARCHAR(192),
  "linked_broker_approval_id" VARCHAR(36),
  "linked_action_pipeline_id" VARCHAR(36),
  "failure_count" INTEGER NOT NULL DEFAULT 0,
  "last_error" TEXT,
  "safety_paused_at" TIMESTAMP(3),
  "outcome_label" VARCHAR(32),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "lecipm_execution_tasks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "lecipm_execution_action_logs" (
  "id" TEXT NOT NULL,
  "task_id" TEXT NOT NULL,
  "action" VARCHAR(96) NOT NULL,
  "result_json" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "lecipm_execution_action_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "lecipm_execution_tasks_idempotency_key_key" ON "lecipm_execution_tasks"("idempotency_key");

CREATE INDEX "lecipm_execution_tasks_broker_user_id_status_updated_at_idx" ON "lecipm_execution_tasks"("broker_user_id", "status", "updated_at" DESC);

CREATE INDEX "lecipm_execution_tasks_broker_user_id_task_type_idx" ON "lecipm_execution_tasks"("broker_user_id", "task_type");

CREATE INDEX "lecipm_execution_tasks_entity_type_entity_id_idx" ON "lecipm_execution_tasks"("entity_type", "entity_id");

CREATE INDEX "lecipm_execution_action_logs_task_id_created_at_idx" ON "lecipm_execution_action_logs"("task_id", "created_at");

ALTER TABLE "lecipm_broker_execution_settings" ADD CONSTRAINT "lecipm_broker_execution_settings_broker_user_id_fkey" FOREIGN KEY ("broker_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lecipm_execution_tasks" ADD CONSTRAINT "lecipm_execution_tasks_broker_user_id_fkey" FOREIGN KEY ("broker_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lecipm_execution_action_logs" ADD CONSTRAINT "lecipm_execution_action_logs_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "lecipm_execution_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
