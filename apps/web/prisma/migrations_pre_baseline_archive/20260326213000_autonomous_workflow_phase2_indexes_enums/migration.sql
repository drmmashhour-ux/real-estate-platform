-- Phase 2: task status, automation event statuses, query indexes

DO $$ BEGIN
  ALTER TYPE "AutonomousWorkflowTaskStatus" ADD VALUE 'blocked';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TYPE "WorkflowAutomationEventStatus" ADD VALUE 'pending';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TYPE "WorkflowAutomationEventStatus" ADD VALUE 'completed';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TYPE "WorkflowAutomationEventStatus" ADD VALUE 'dismissed';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TYPE "WorkflowAutomationEventStatus" ADD VALUE 'approved';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "autonomous_workflow_tasks_priority_idx" ON "autonomous_workflow_tasks"("priority");
CREATE INDEX IF NOT EXISTS "autonomous_workflow_tasks_target_user_role_idx" ON "autonomous_workflow_tasks"("target_user_role");
CREATE INDEX IF NOT EXISTS "autonomous_workflow_tasks_created_at_idx" ON "autonomous_workflow_tasks"("created_at" DESC);
