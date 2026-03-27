-- Phase 7 TrustGraph: enterprise compliance workspaces, document approvals, SLA

CREATE TYPE "TrustgraphComplianceOrgType" AS ENUM ('brokerage', 'investor_firm', 'admin_internal', 'legal_team');
CREATE TYPE "TrustgraphWorkspaceMemberRole" AS ENUM (
  'workspace_admin',
  'workspace_manager',
  'workspace_reviewer',
  'workspace_legal_reviewer',
  'workspace_viewer'
);
CREATE TYPE "TrustgraphWorkspaceMemberStatus" AS ENUM ('active', 'suspended', 'invited');

CREATE TABLE "trustgraph_compliance_workspaces" (
  "id" TEXT NOT NULL,
  "org_type" "TrustgraphComplianceOrgType" NOT NULL,
  "org_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "branding" JSONB,
  "settings" JSONB,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "trustgraph_compliance_workspaces_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "idx_tg_workspace_org" ON "trustgraph_compliance_workspaces"("org_type", "org_id");

CREATE TABLE "trustgraph_compliance_workspace_members" (
  "id" TEXT NOT NULL,
  "workspace_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "role" "TrustgraphWorkspaceMemberRole" NOT NULL,
  "status" "TrustgraphWorkspaceMemberStatus" NOT NULL DEFAULT 'active',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "trustgraph_compliance_workspace_members_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "uq_tg_workspace_member" ON "trustgraph_compliance_workspace_members"("workspace_id", "user_id");
CREATE INDEX "idx_tg_workspace_member_user" ON "trustgraph_compliance_workspace_members"("user_id");
ALTER TABLE "trustgraph_compliance_workspace_members" ADD CONSTRAINT "trustgraph_compliance_workspace_members_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "trustgraph_compliance_workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "trustgraph_compliance_workspace_members" ADD CONSTRAINT "trustgraph_compliance_workspace_members_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "trustgraph_compliance_workspace_entity_links" (
  "id" TEXT NOT NULL,
  "workspace_id" TEXT NOT NULL,
  "entity_type" TEXT NOT NULL,
  "entity_id" TEXT NOT NULL,
  "relation_type" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "trustgraph_compliance_workspace_entity_links_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "idx_tg_ws_entity_workspace" ON "trustgraph_compliance_workspace_entity_links"("workspace_id", "entity_type");
CREATE INDEX "idx_tg_ws_entity_lookup" ON "trustgraph_compliance_workspace_entity_links"("entity_type", "entity_id");
ALTER TABLE "trustgraph_compliance_workspace_entity_links" ADD CONSTRAINT "trustgraph_compliance_workspace_entity_links_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "trustgraph_compliance_workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "trustgraph_workspace_case_assignments" (
  "id" TEXT NOT NULL,
  "workspace_id" TEXT NOT NULL,
  "case_id" UUID NOT NULL,
  "assigned_to" TEXT,
  "assigned_by" TEXT,
  "priority" TEXT NOT NULL DEFAULT 'normal',
  "due_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "trustgraph_workspace_case_assignments_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "uq_tg_ws_case_assignment" ON "trustgraph_workspace_case_assignments"("workspace_id", "case_id");
CREATE INDEX "idx_tg_ws_case_assignment_case" ON "trustgraph_workspace_case_assignments"("case_id");
ALTER TABLE "trustgraph_workspace_case_assignments" ADD CONSTRAINT "trustgraph_workspace_case_assignments_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "trustgraph_compliance_workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "trustgraph_workspace_case_assignments" ADD CONSTRAINT "trustgraph_workspace_case_assignments_case_id_fkey"
  FOREIGN KEY ("case_id") REFERENCES "verification_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "trustgraph_document_approval_flows" (
  "id" TEXT NOT NULL,
  "entity_type" TEXT NOT NULL,
  "entity_id" TEXT NOT NULL,
  "document_type" TEXT NOT NULL,
  "current_status" TEXT NOT NULL,
  "workspace_id" TEXT,
  "started_by" TEXT NOT NULL,
  "resolved_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "trustgraph_document_approval_flows_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "idx_tg_doc_approval_entity" ON "trustgraph_document_approval_flows"("entity_type", "entity_id");
CREATE INDEX "idx_tg_doc_approval_workspace" ON "trustgraph_document_approval_flows"("workspace_id");
ALTER TABLE "trustgraph_document_approval_flows" ADD CONSTRAINT "trustgraph_document_approval_flows_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "trustgraph_compliance_workspaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "trustgraph_document_approval_steps" (
  "id" TEXT NOT NULL,
  "approval_flow_id" TEXT NOT NULL,
  "step_kind" TEXT NOT NULL,
  "assigned_to" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "due_at" TIMESTAMPTZ(6),
  "metadata" JSONB,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "trustgraph_document_approval_steps_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "idx_tg_doc_approval_steps_flow" ON "trustgraph_document_approval_steps"("approval_flow_id");
ALTER TABLE "trustgraph_document_approval_steps" ADD CONSTRAINT "trustgraph_document_approval_steps_approval_flow_id_fkey"
  FOREIGN KEY ("approval_flow_id") REFERENCES "trustgraph_document_approval_flows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "trustgraph_document_approval_actions" (
  "id" TEXT NOT NULL,
  "approval_flow_id" TEXT NOT NULL,
  "step_id" TEXT,
  "actor_id" TEXT NOT NULL,
  "action_type" TEXT NOT NULL,
  "notes" TEXT,
  "payload" JSONB,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "trustgraph_document_approval_actions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "idx_tg_doc_approval_actions_flow" ON "trustgraph_document_approval_actions"("approval_flow_id");
CREATE INDEX "idx_tg_doc_approval_actions_step" ON "trustgraph_document_approval_actions"("step_id");
ALTER TABLE "trustgraph_document_approval_actions" ADD CONSTRAINT "trustgraph_document_approval_actions_approval_flow_id_fkey"
  FOREIGN KEY ("approval_flow_id") REFERENCES "trustgraph_document_approval_flows"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "trustgraph_document_approval_actions" ADD CONSTRAINT "trustgraph_document_approval_actions_step_id_fkey"
  FOREIGN KEY ("step_id") REFERENCES "trustgraph_document_approval_steps"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "trustgraph_sla_policies" (
  "id" TEXT NOT NULL,
  "workspace_id" TEXT,
  "name" TEXT NOT NULL,
  "queue_key" TEXT NOT NULL,
  "due_hours" INTEGER NOT NULL,
  "escalates_after_hours" INTEGER,
  "settings" JSONB,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "trustgraph_sla_policies_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "idx_tg_sla_policy_ws_queue" ON "trustgraph_sla_policies"("workspace_id", "queue_key");
ALTER TABLE "trustgraph_sla_policies" ADD CONSTRAINT "trustgraph_sla_policies_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "trustgraph_compliance_workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "trustgraph_sla_events" (
  "id" TEXT NOT NULL,
  "case_id" UUID,
  "approval_flow_id" TEXT,
  "event_type" TEXT NOT NULL,
  "payload" JSONB,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "trustgraph_sla_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "idx_tg_sla_events_case" ON "trustgraph_sla_events"("case_id");

CREATE TABLE "trustgraph_case_sla_states" (
  "id" TEXT NOT NULL,
  "workspace_id" TEXT,
  "case_id" UUID NOT NULL,
  "sla_policy_id" TEXT,
  "state" TEXT NOT NULL,
  "due_at" TIMESTAMPTZ(6),
  "paused_reason" TEXT,
  "metadata" JSONB,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "trustgraph_case_sla_states_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "trustgraph_case_sla_states_case_id_key" ON "trustgraph_case_sla_states"("case_id");
CREATE INDEX "idx_tg_case_sla_ws" ON "trustgraph_case_sla_states"("workspace_id");
ALTER TABLE "trustgraph_case_sla_states" ADD CONSTRAINT "trustgraph_case_sla_states_case_id_fkey"
  FOREIGN KEY ("case_id") REFERENCES "verification_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "trustgraph_case_sla_states" ADD CONSTRAINT "trustgraph_case_sla_states_sla_policy_id_fkey"
  FOREIGN KEY ("sla_policy_id") REFERENCES "trustgraph_sla_policies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
