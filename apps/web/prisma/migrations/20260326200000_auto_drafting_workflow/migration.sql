-- AI Auto-Drafting audit + Autonomous Workflow tasks + automation event log

DO $$ BEGIN
  CREATE TYPE "AutoDraftingActionType" AS ENUM ('generate', 'section', 'clause', 'rewrite_notes', 'follow_up', 'review_summary');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "AutonomousWorkflowTaskStatus" AS ENUM ('pending', 'approved', 'dismissed', 'completed');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "WorkflowAutomationEventStatus" AS ENUM ('success', 'skipped', 'blocked', 'failed');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "auto_drafting_events" (
  "id" TEXT PRIMARY KEY,
  "document_id" TEXT NOT NULL,
  "section_key" TEXT,
  "action_type" "AutoDraftingActionType" NOT NULL,
  "input_payload" JSONB NOT NULL,
  "output_payload" JSONB NOT NULL,
  "created_by" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  CONSTRAINT "auto_drafting_events_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "seller_declaration_drafts"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "auto_drafting_events_document_id_idx" ON "auto_drafting_events"("document_id");
CREATE INDEX IF NOT EXISTS "auto_drafting_events_created_by_idx" ON "auto_drafting_events"("created_by");
CREATE INDEX IF NOT EXISTS "auto_drafting_events_action_type_idx" ON "auto_drafting_events"("action_type");

CREATE TABLE IF NOT EXISTS "autonomous_workflow_tasks" (
  "id" TEXT PRIMARY KEY,
  "document_id" TEXT,
  "property_id" TEXT,
  "task_type" TEXT NOT NULL,
  "priority" TEXT NOT NULL,
  "target_user_role" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "status" "AutonomousWorkflowTaskStatus" NOT NULL DEFAULT 'pending',
  "requires_approval" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  CONSTRAINT "autonomous_workflow_tasks_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "seller_declaration_drafts"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "autonomous_workflow_tasks_document_id_idx" ON "autonomous_workflow_tasks"("document_id");
CREATE INDEX IF NOT EXISTS "autonomous_workflow_tasks_property_id_idx" ON "autonomous_workflow_tasks"("property_id");
CREATE INDEX IF NOT EXISTS "autonomous_workflow_tasks_status_idx" ON "autonomous_workflow_tasks"("status");

CREATE TABLE IF NOT EXISTS "workflow_automation_events" (
  "id" TEXT PRIMARY KEY,
  "trigger_type" TEXT NOT NULL,
  "entity_type" TEXT NOT NULL,
  "entity_id" TEXT NOT NULL,
  "action_type" TEXT NOT NULL,
  "status" "WorkflowAutomationEventStatus" NOT NULL,
  "payload" JSONB,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "workflow_automation_events_entity_idx" ON "workflow_automation_events"("entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS "workflow_automation_events_trigger_idx" ON "workflow_automation_events"("trigger_type");
