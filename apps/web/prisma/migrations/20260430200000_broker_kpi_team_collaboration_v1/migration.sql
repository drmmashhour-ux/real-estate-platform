-- Broker KPI board + brokerage team collaboration (internal ops; RBAC enforced in app layer).

CREATE TYPE "BrokerTeamMemberRole" AS ENUM ('owner', 'admin', 'broker', 'assistant', 'coordinator', 'analyst', 'reviewer');

CREATE TYPE "BrokerTeamMemberStatus" AS ENUM ('invited', 'active', 'suspended');

CREATE TYPE "BrokerCollaborationVisibilityScope" AS ENUM ('private', 'assigned_team', 'brokerage_admin', 'deal_participants_internal');

CREATE TYPE "BrokerCollaborationMessageType" AS ENUM ('text', 'mention', 'escalation', 'review_request', 'system');

CREATE TYPE "BrokerDealAssignmentRole" AS ENUM ('lead_broker', 'support_broker', 'transaction_coordinator', 'reviewer', 'admin_observer');

CREATE TYPE "BrokerDealAssignmentStatus" AS ENUM ('active', 'completed', 'cancelled');

CREATE TYPE "BrokerInternalNoteType" AS ENUM ('general', 'review', 'escalation', 'coordination');

CREATE TABLE "broker_teams" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "owner_broker_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "broker_teams_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "broker_team_members" (
    "id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "BrokerTeamMemberRole" NOT NULL,
    "status" "BrokerTeamMemberStatus" NOT NULL DEFAULT 'invited',
    "joined_at" TIMESTAMP(3),

    CONSTRAINT "broker_team_members_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "broker_collaboration_threads" (
    "id" TEXT NOT NULL,
    "team_id" TEXT,
    "deal_id" TEXT,
    "listing_id" TEXT,
    "lecipm_contact_id" TEXT,
    "created_by_id" TEXT NOT NULL,
    "visibility_scope" "BrokerCollaborationVisibilityScope" NOT NULL,
    "title" VARCHAR(200),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "broker_collaboration_threads_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "broker_collaboration_messages" (
    "id" TEXT NOT NULL,
    "thread_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "message_type" "BrokerCollaborationMessageType" NOT NULL DEFAULT 'text',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "broker_collaboration_messages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "broker_deal_assignments" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "assigned_to_user_id" TEXT NOT NULL,
    "assigned_by_user_id" TEXT NOT NULL,
    "role_on_deal" "BrokerDealAssignmentRole" NOT NULL,
    "status" "BrokerDealAssignmentStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "broker_deal_assignments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "broker_internal_notes" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT,
    "listing_id" TEXT,
    "lecipm_contact_id" TEXT,
    "created_by_id" TEXT NOT NULL,
    "visibility_scope" "BrokerCollaborationVisibilityScope" NOT NULL,
    "note_type" "BrokerInternalNoteType" NOT NULL,
    "body" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "broker_internal_notes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "broker_workspace_audit_events" (
    "id" TEXT NOT NULL,
    "actor_user_id" TEXT NOT NULL,
    "team_id" TEXT,
    "deal_id" TEXT,
    "thread_id" TEXT,
    "action_key" VARCHAR(96) NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "broker_workspace_audit_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "broker_teams_owner_broker_id_idx" ON "broker_teams"("owner_broker_id");

CREATE UNIQUE INDEX "broker_team_members_team_id_user_id_key" ON "broker_team_members"("team_id", "user_id");

CREATE INDEX "broker_team_members_user_id_idx" ON "broker_team_members"("user_id");

CREATE INDEX "broker_collaboration_threads_team_id_idx" ON "broker_collaboration_threads"("team_id");

CREATE INDEX "broker_collaboration_threads_deal_id_idx" ON "broker_collaboration_threads"("deal_id");

CREATE INDEX "broker_collaboration_threads_created_by_id_idx" ON "broker_collaboration_threads"("created_by_id");

CREATE INDEX "broker_collaboration_messages_thread_id_created_at_idx" ON "broker_collaboration_messages"("thread_id", "created_at");

CREATE INDEX "broker_deal_assignments_deal_id_idx" ON "broker_deal_assignments"("deal_id");

CREATE INDEX "broker_deal_assignments_assigned_to_user_id_status_idx" ON "broker_deal_assignments"("assigned_to_user_id", "status");

CREATE INDEX "broker_deal_assignments_assigned_by_user_id_idx" ON "broker_deal_assignments"("assigned_by_user_id");

CREATE INDEX "broker_internal_notes_deal_id_idx" ON "broker_internal_notes"("deal_id");

CREATE INDEX "broker_internal_notes_listing_id_idx" ON "broker_internal_notes"("listing_id");

CREATE INDEX "broker_internal_notes_created_by_id_idx" ON "broker_internal_notes"("created_by_id");

CREATE INDEX "broker_workspace_audit_events_actor_user_id_created_at_idx" ON "broker_workspace_audit_events"("actor_user_id", "created_at");

CREATE INDEX "broker_workspace_audit_events_action_key_idx" ON "broker_workspace_audit_events"("action_key");

CREATE INDEX "broker_workspace_audit_events_team_id_idx" ON "broker_workspace_audit_events"("team_id");

CREATE INDEX "broker_workspace_audit_events_deal_id_idx" ON "broker_workspace_audit_events"("deal_id");

ALTER TABLE "broker_teams" ADD CONSTRAINT "broker_teams_owner_broker_id_fkey" FOREIGN KEY ("owner_broker_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "broker_team_members" ADD CONSTRAINT "broker_team_members_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "broker_teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "broker_team_members" ADD CONSTRAINT "broker_team_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "broker_collaboration_threads" ADD CONSTRAINT "broker_collaboration_threads_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "broker_teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "broker_collaboration_threads" ADD CONSTRAINT "broker_collaboration_threads_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "broker_collaboration_threads" ADD CONSTRAINT "broker_collaboration_threads_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "broker_collaboration_threads" ADD CONSTRAINT "broker_collaboration_threads_lecipm_contact_id_fkey" FOREIGN KEY ("lecipm_contact_id") REFERENCES "lecipm_crm_contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "broker_collaboration_threads" ADD CONSTRAINT "broker_collaboration_threads_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "broker_collaboration_messages" ADD CONSTRAINT "broker_collaboration_messages_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "broker_collaboration_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "broker_collaboration_messages" ADD CONSTRAINT "broker_collaboration_messages_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "broker_deal_assignments" ADD CONSTRAINT "broker_deal_assignments_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "broker_deal_assignments" ADD CONSTRAINT "broker_deal_assignments_assigned_to_user_id_fkey" FOREIGN KEY ("assigned_to_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "broker_deal_assignments" ADD CONSTRAINT "broker_deal_assignments_assigned_by_user_id_fkey" FOREIGN KEY ("assigned_by_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "broker_internal_notes" ADD CONSTRAINT "broker_internal_notes_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "broker_internal_notes" ADD CONSTRAINT "broker_internal_notes_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "broker_internal_notes" ADD CONSTRAINT "broker_internal_notes_lecipm_contact_id_fkey" FOREIGN KEY ("lecipm_contact_id") REFERENCES "lecipm_crm_contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "broker_internal_notes" ADD CONSTRAINT "broker_internal_notes_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "broker_workspace_audit_events" ADD CONSTRAINT "broker_workspace_audit_events_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "broker_workspace_audit_events" ADD CONSTRAINT "broker_workspace_audit_events_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "broker_teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "broker_workspace_audit_events" ADD CONSTRAINT "broker_workspace_audit_events_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "broker_workspace_audit_events" ADD CONSTRAINT "broker_workspace_audit_events_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "broker_collaboration_threads"("id") ON DELETE SET NULL ON UPDATE CASCADE;
