-- Executive command center: supervised multi-agent orchestration (tasks, runs, policy, conflicts, memory).

CREATE TABLE "executive_tasks" (
    "id" TEXT NOT NULL,
    "entity_type" VARCHAR(32) NOT NULL,
    "entity_id" VARCHAR(36) NOT NULL,
    "originating_agent" VARCHAR(64) NOT NULL,
    "assigned_agent" VARCHAR(64),
    "task_type" VARCHAR(32) NOT NULL,
    "status" VARCHAR(24) NOT NULL DEFAULT 'OPEN',
    "priority" VARCHAR(16) NOT NULL,
    "title" VARCHAR(512) NOT NULL,
    "summary" TEXT NOT NULL,
    "payload_json" JSONB,
    "recommendation_json" JSONB,
    "blockers_json" JSONB,
    "due_date" TIMESTAMP(3),
    "requires_human_approval" BOOLEAN NOT NULL DEFAULT true,
    "owner_user_id" TEXT,
    "orchestrator_version" VARCHAR(24),
    "agent_schema_version" VARCHAR(24),
    "policy_version" VARCHAR(24),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "executive_tasks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_runs" (
    "id" TEXT NOT NULL,
    "agent_name" VARCHAR(64) NOT NULL,
    "entity_type" VARCHAR(32) NOT NULL,
    "entity_id" VARCHAR(36),
    "run_mode" VARCHAR(16) NOT NULL,
    "status" VARCHAR(16) NOT NULL,
    "input_snapshot_json" JSONB NOT NULL,
    "output_snapshot_json" JSONB NOT NULL,
    "orchestrator_version" VARCHAR(24),
    "agent_schema_version" VARCHAR(24),
    "policy_version" VARCHAR(24),
    "triggered_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_runs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "executive_decisions" (
    "id" TEXT NOT NULL,
    "task_id" TEXT,
    "entity_type" VARCHAR(32) NOT NULL,
    "entity_id" VARCHAR(36) NOT NULL,
    "decision_type" VARCHAR(24) NOT NULL,
    "actor_user_id" TEXT,
    "rationale" TEXT,
    "metadata_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "executive_decisions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_memory_notes" (
    "id" TEXT NOT NULL,
    "agent_name" VARCHAR(64) NOT NULL,
    "entity_type" VARCHAR(32) NOT NULL,
    "entity_id" VARCHAR(36) NOT NULL,
    "note_type" VARCHAR(32) NOT NULL,
    "summary" TEXT NOT NULL,
    "payload_json" JSONB,
    "confidence_level" VARCHAR(16),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_memory_notes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "executive_conflicts" (
    "id" TEXT NOT NULL,
    "entity_type" VARCHAR(32) NOT NULL,
    "entity_id" VARCHAR(36) NOT NULL,
    "agent_a" VARCHAR(64) NOT NULL,
    "agent_b" VARCHAR(64) NOT NULL,
    "conflict_type" VARCHAR(24) NOT NULL,
    "summary" TEXT NOT NULL,
    "resolution_status" VARCHAR(16) NOT NULL DEFAULT 'OPEN',
    "resolution_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "executive_conflicts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "executive_policies" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT,
    "autonomy_mode" VARCHAR(24) NOT NULL DEFAULT 'SAFE_APPROVAL',
    "allow_low_risk_auto_tasks" BOOLEAN NOT NULL DEFAULT true,
    "allow_cross_agent_routing" BOOLEAN NOT NULL DEFAULT true,
    "allow_auto_followups" BOOLEAN NOT NULL DEFAULT true,
    "allow_auto_approvals" BOOLEAN NOT NULL DEFAULT false,
    "financial_risk_tolerance" VARCHAR(16),
    "legal_risk_tolerance" VARCHAR(16),
    "esg_priority" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "growth_priority" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "compliance_priority" DOUBLE PRECISION NOT NULL DEFAULT 1.3,
    "policy_version" VARCHAR(16) NOT NULL DEFAULT 'v1.0.0',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "executive_policies_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "executive_policies_owner_id_key" ON "executive_policies"("owner_id");

ALTER TABLE "executive_tasks" ADD CONSTRAINT "executive_tasks_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_triggered_by_user_id_fkey" FOREIGN KEY ("triggered_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "executive_decisions" ADD CONSTRAINT "executive_decisions_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "executive_tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "executive_decisions" ADD CONSTRAINT "executive_decisions_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "executive_policies" ADD CONSTRAINT "executive_policies_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "executive_tasks_entity_type_entity_id_idx" ON "executive_tasks"("entity_type", "entity_id");
CREATE INDEX "executive_tasks_status_priority_idx" ON "executive_tasks"("status", "priority");
CREATE INDEX "executive_tasks_owner_user_id_idx" ON "executive_tasks"("owner_user_id");
CREATE INDEX "agent_runs_triggered_by_user_id_created_at_idx" ON "agent_runs"("triggered_by_user_id", "created_at" DESC);
CREATE INDEX "agent_runs_entity_type_entity_id_idx" ON "agent_runs"("entity_type", "entity_id");
CREATE INDEX "executive_decisions_task_id_idx" ON "executive_decisions"("task_id");
CREATE INDEX "executive_decisions_entity_type_entity_id_idx" ON "executive_decisions"("entity_type", "entity_id");
CREATE INDEX "agent_memory_notes_entity_type_entity_id_created_at_idx" ON "agent_memory_notes"("entity_type", "entity_id", "created_at" DESC);
CREATE INDEX "executive_conflicts_entity_type_entity_id_idx" ON "executive_conflicts"("entity_type", "entity_id");
