-- AI workflow launcher: optional result blob + per-step execution audit.

ALTER TABLE "ai_workflows" ADD COLUMN "result" JSONB;

CREATE TABLE "ai_workflow_execution_logs" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "stepIndex" INTEGER NOT NULL,
    "stepType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "input" JSONB,
    "output" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_workflow_execution_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AIWorkflowExecutionLog_workflowId_stepIndex_idx" ON "ai_workflow_execution_logs"("workflowId", "stepIndex");

ALTER TABLE "ai_workflow_execution_logs"
  ADD CONSTRAINT "ai_workflow_execution_logs_workflowId_fkey"
  FOREIGN KEY ("workflowId") REFERENCES "ai_workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "AIWorkflow_ownerType_ownerId_status_idx" ON "ai_workflows"("ownerType", "ownerId", "status");
