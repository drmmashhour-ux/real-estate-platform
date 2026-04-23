-- LECIPM: unified compliance audit records, export bundles, inspection sessions

CREATE TABLE "compliance_audit_records" (
    "id" TEXT NOT NULL,
    "audit_number" TEXT NOT NULL,
    "owner_type" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action_type" TEXT NOT NULL,
    "module_key" TEXT NOT NULL,
    "actor_type" TEXT,
    "actor_id" TEXT,
    "linked_listing_id" TEXT,
    "linked_deal_id" TEXT,
    "linked_offer_id" TEXT,
    "linked_contract_id" TEXT,
    "linked_complaint_case_id" TEXT,
    "linked_trust_deposit_id" TEXT,
    "ai_assisted" BOOLEAN NOT NULL DEFAULT false,
    "human_review_required" BOOLEAN NOT NULL DEFAULT false,
    "human_review_completed" BOOLEAN NOT NULL DEFAULT false,
    "severity" TEXT NOT NULL DEFAULT 'info',
    "summary" TEXT NOT NULL,
    "details" JSONB,
    "immutable_hash" TEXT NOT NULL,
    "event_timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compliance_audit_records_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "compliance_audit_records_audit_number_key" ON "compliance_audit_records"("audit_number");
CREATE INDEX "idx_compliance_audit_owner" ON "compliance_audit_records"("owner_type", "owner_id");
CREATE INDEX "idx_compliance_audit_event_ts" ON "compliance_audit_records"("event_timestamp");
CREATE INDEX "idx_compliance_audit_module" ON "compliance_audit_records"("module_key");

CREATE TABLE "compliance_export_bundles" (
    "id" TEXT NOT NULL,
    "bundle_number" TEXT NOT NULL,
    "owner_type" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "bundle_type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "target_entity_type" TEXT,
    "target_entity_id" TEXT,
    "date_from" TIMESTAMP(3),
    "date_to" TIMESTAMP(3),
    "generated_by_id" TEXT,
    "generated_at" TIMESTAMP(3),
    "sealed_at" TIMESTAMP(3),
    "manifest" JSONB,
    "file_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compliance_export_bundles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "compliance_export_bundles_bundle_number_key" ON "compliance_export_bundles"("bundle_number");
CREATE INDEX "idx_compliance_export_owner" ON "compliance_export_bundles"("owner_type", "owner_id");

CREATE TABLE "compliance_export_items" (
    "id" TEXT NOT NULL,
    "compliance_export_bundle_id" TEXT NOT NULL,
    "source_type" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,

    CONSTRAINT "compliance_export_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_compliance_export_item_bundle" ON "compliance_export_items"("compliance_export_bundle_id");

ALTER TABLE "compliance_export_items" ADD CONSTRAINT "compliance_export_items_compliance_export_bundle_id_fkey" FOREIGN KEY ("compliance_export_bundle_id") REFERENCES "compliance_export_bundles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "inspection_access_sessions" (
    "id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "owner_type" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "requested_by_id" TEXT,
    "reviewer_type" TEXT NOT NULL,
    "scope_type" TEXT NOT NULL,
    "scope_id" TEXT,
    "read_only" BOOLEAN NOT NULL DEFAULT true,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inspection_access_sessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "inspection_access_sessions_session_token_key" ON "inspection_access_sessions"("session_token");
CREATE INDEX "idx_inspection_session_owner" ON "inspection_access_sessions"("owner_type", "owner_id");
