-- LECIPM Platform Core v1 — unified decisions, tasks, audit, approvals (additive)

CREATE TABLE "platform_core_decisions" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "evidenceScore" DOUBLE PRECISION,
    "status" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "expectedImpact" TEXT,
    "warnings" JSONB,
    "blockers" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_core_decisions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "platform_core_tasks" (
    "id" TEXT NOT NULL,
    "taskType" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_core_tasks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "platform_core_audit_events" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_core_audit_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "platform_core_approvals" (
    "id" TEXT NOT NULL,
    "decisionId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "reviewerUserId" TEXT,
    "reviewerNote" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_core_approvals_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "platform_core_decisions_source_createdAt_idx" ON "platform_core_decisions"("source", "createdAt");
CREATE INDEX "platform_core_decisions_entityType_entityId_idx" ON "platform_core_decisions"("entityType", "entityId");
CREATE INDEX "platform_core_decisions_status_createdAt_idx" ON "platform_core_decisions"("status", "createdAt");
CREATE INDEX "platform_core_decisions_actionType_createdAt_idx" ON "platform_core_decisions"("actionType", "createdAt");

CREATE INDEX "platform_core_tasks_status_createdAt_idx" ON "platform_core_tasks"("status", "createdAt");
CREATE INDEX "platform_core_tasks_source_createdAt_idx" ON "platform_core_tasks"("source", "createdAt");
CREATE INDEX "platform_core_tasks_entityType_entityId_idx" ON "platform_core_tasks"("entityType", "entityId");

CREATE INDEX "platform_core_audit_events_eventType_createdAt_idx" ON "platform_core_audit_events"("eventType", "createdAt");
CREATE INDEX "platform_core_audit_events_source_createdAt_idx" ON "platform_core_audit_events"("source", "createdAt");
CREATE INDEX "platform_core_audit_events_entityType_entityId_idx" ON "platform_core_audit_events"("entityType", "entityId");

CREATE INDEX "platform_core_approvals_decisionId_status_idx" ON "platform_core_approvals"("decisionId", "status");
CREATE INDEX "platform_core_approvals_reviewerUserId_createdAt_idx" ON "platform_core_approvals"("reviewerUserId", "createdAt");

ALTER TABLE "platform_core_approvals" ADD CONSTRAINT "platform_core_approvals_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "platform_core_decisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
