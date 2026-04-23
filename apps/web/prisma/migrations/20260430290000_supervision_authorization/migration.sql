-- Authorization, delegation, supervision, accountability chain (Phase 12).

CREATE TABLE "compliance_actor_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "actor_type" TEXT NOT NULL,
    "display_role" TEXT,
    "license_status" TEXT,
    "license_number" TEXT,
    "license_category" TEXT,
    "agency_id" TEXT,
    "supervising_actor_id" TEXT,
    "can_hold_trust_authority" BOOLEAN NOT NULL DEFAULT false,
    "can_approve_contracts" BOOLEAN NOT NULL DEFAULT false,
    "can_close_complaints" BOOLEAN NOT NULL DEFAULT false,
    "can_publish_listings" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compliance_actor_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "compliance_actor_profiles_user_id_key" ON "compliance_actor_profiles"("user_id");
CREATE INDEX "idx_compliance_actor_type" ON "compliance_actor_profiles"("actor_type");
CREATE INDEX "idx_compliance_actor_agency" ON "compliance_actor_profiles"("agency_id");

CREATE TABLE "delegated_authorities" (
    "id" TEXT NOT NULL,
    "owner_type" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "delegator_actor_id" TEXT NOT NULL,
    "delegate_actor_id" TEXT NOT NULL,
    "authority_key" TEXT NOT NULL,
    "scope_type" TEXT NOT NULL,
    "scope_id" TEXT,
    "can_execute" BOOLEAN NOT NULL DEFAULT false,
    "requires_approval" BOOLEAN NOT NULL DEFAULT true,
    "approval_actor_id" TEXT,
    "starts_at" TIMESTAMP(3),
    "ends_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delegated_authorities_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_delegation_owner_delegate" ON "delegated_authorities"("owner_type", "owner_id", "delegate_actor_id");
CREATE INDEX "idx_delegation_authority" ON "delegated_authorities"("authority_key");

CREATE TABLE "supervision_assignments" (
    "id" TEXT NOT NULL,
    "owner_type" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "supervisor_actor_id" TEXT NOT NULL,
    "supervised_actor_id" TEXT NOT NULL,
    "supervision_type" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "starts_at" TIMESTAMP(3),
    "ends_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supervision_assignments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_supervision_owner_supervised" ON "supervision_assignments"("owner_type", "owner_id", "supervised_actor_id");

CREATE TABLE "accountability_records" (
    "id" TEXT NOT NULL,
    "owner_type" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action_key" TEXT NOT NULL,
    "performed_by_actor_id" TEXT NOT NULL,
    "accountable_actor_id" TEXT NOT NULL,
    "supervisor_actor_id" TEXT,
    "delegated" BOOLEAN NOT NULL DEFAULT false,
    "delegation_id" TEXT,
    "supervision_id" TEXT,
    "approval_required" BOOLEAN NOT NULL DEFAULT false,
    "approval_completed" BOOLEAN NOT NULL DEFAULT false,
    "approved_by_actor_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accountability_records_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_accountability_owner" ON "accountability_records"("owner_type", "owner_id");
CREATE INDEX "idx_accountability_accountable" ON "accountability_records"("accountable_actor_id");
CREATE INDEX "idx_accountability_entity" ON "accountability_records"("entity_type", "entity_id");

CREATE TABLE "delegated_approval_tasks" (
    "id" TEXT NOT NULL,
    "owner_type" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "delegation_id" TEXT,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action_key" TEXT NOT NULL,
    "requested_by_actor_id" TEXT NOT NULL,
    "approver_actor_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delegated_approval_tasks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_delegated_approval_owner_status" ON "delegated_approval_tasks"("owner_type", "owner_id", "status");
