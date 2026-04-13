-- Deal coordination hub v1: document requests, bank/notary coordination, audit

CREATE TYPE "DealRequestStatus" AS ENUM (
  'DRAFT',
  'READY',
  'SENT',
  'AWAITING_RESPONSE',
  'PARTIALLY_FULFILLED',
  'FULFILLED',
  'OVERDUE',
  'BLOCKED',
  'CANCELLED'
);

CREATE TYPE "DealRequestCategory" AS ENUM (
  'SELLER_DOCUMENTS',
  'BUYER_DOCUMENTS',
  'LENDER_DOCUMENTS',
  'SYNDICATE_DOCUMENTS',
  'INSPECTION_DOCUMENTS',
  'IDENTITY_COMPLIANCE',
  'NOTARY_PREPARATION',
  'CLOSING_SUPPORT',
  'OTHER'
);

CREATE TYPE "CoordinationTargetRole" AS ENUM (
  'BUYER',
  'SELLER',
  'BROKER',
  'LENDER',
  'NOTARY',
  'SYNDICATE',
  'INSPECTOR',
  'EXPERT',
  'INSURER'
);

CREATE TYPE "DealRequestItemStatus" AS ENUM (
  'PENDING',
  'RECEIVED',
  'VALIDATED',
  'REJECTED',
  'WAIVED'
);

CREATE TYPE "RequestCommunicationChannel" AS ENUM (
  'IN_APP',
  'EMAIL_DRAFT',
  'MANUAL_EXPORT'
);

CREATE TYPE "RequestCommunicationDirection" AS ENUM (
  'OUTBOUND',
  'INBOUND',
  'INTERNAL_NOTE'
);

CREATE TYPE "DealFinancingCoordinationStatus" AS ENUM (
  'NOT_STARTED',
  'APPLICATION_IN_PROGRESS',
  'UNDERTAKING_PENDING',
  'UNDERTAKING_RECEIVED',
  'ADDITIONAL_INFO_NEEDED',
  'REFUSED',
  'CONDITION_FULFILLED',
  'CONDITION_FAILED'
);

CREATE TYPE "CoordinationContactType" AS ENUM (
  'LENDER',
  'NOTARY',
  'SYNDICATE',
  'INSPECTOR',
  'BUYER_AGENT',
  'OTHER'
);

-- DealDocument back-relation (no schema change except relation — column-free)

CREATE TABLE "deal_requests" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "request_type" TEXT NOT NULL,
    "request_category" "DealRequestCategory" NOT NULL,
    "status" "DealRequestStatus" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "target_role" "CoordinationTargetRole" NOT NULL,
    "target_entity_type" TEXT,
    "target_entity_id" TEXT,
    "due_at" TIMESTAMP(3),
    "fulfilled_at" TIMESTAMP(3),
    "blocked_reason" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "autopilot_generated" BOOLEAN NOT NULL DEFAULT false,
    "broker_approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deal_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "deal_requests_deal_id_status_idx" ON "deal_requests"("deal_id", "status");
CREATE INDEX "deal_requests_deal_id_request_category_idx" ON "deal_requests"("deal_id", "request_category");

ALTER TABLE "deal_requests" ADD CONSTRAINT "deal_requests_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "deal_request_items" (
    "id" TEXT NOT NULL,
    "deal_request_id" TEXT NOT NULL,
    "item_key" TEXT NOT NULL,
    "item_label" TEXT NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "status" "DealRequestItemStatus" NOT NULL DEFAULT 'PENDING',
    "received_at" TIMESTAMP(3),
    "validated_at" TIMESTAMP(3),
    "validated_by_user_id" TEXT,
    "source_document_id" TEXT,
    "notes" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deal_request_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "deal_request_items_deal_request_id_idx" ON "deal_request_items"("deal_request_id");
CREATE INDEX "deal_request_items_source_document_id_idx" ON "deal_request_items"("source_document_id");

ALTER TABLE "deal_request_items" ADD CONSTRAINT "deal_request_items_deal_request_id_fkey" FOREIGN KEY ("deal_request_id") REFERENCES "deal_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "deal_request_items" ADD CONSTRAINT "deal_request_items_source_document_id_fkey" FOREIGN KEY ("source_document_id") REFERENCES "deal_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "request_communications" (
    "id" TEXT NOT NULL,
    "deal_request_id" TEXT NOT NULL,
    "channel" "RequestCommunicationChannel" NOT NULL,
    "direction" "RequestCommunicationDirection" NOT NULL,
    "subject" TEXT,
    "body" TEXT,
    "sent_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "opened_at" TIMESTAMP(3),
    "created_by_user_id" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "request_communications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "request_communications_deal_request_id_created_at_idx" ON "request_communications"("deal_request_id", "created_at");

ALTER TABLE "request_communications" ADD CONSTRAINT "request_communications_deal_request_id_fkey" FOREIGN KEY ("deal_request_id") REFERENCES "deal_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "coordination_contacts" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "contact_type" "CoordinationContactType" NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "organization" TEXT,
    "region" TEXT,
    "role_metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coordination_contacts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "coordination_contacts_deal_id_contact_type_idx" ON "coordination_contacts"("deal_id", "contact_type");

ALTER TABLE "coordination_contacts" ADD CONSTRAINT "coordination_contacts_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "deal_bank_coordinations" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "financing_status" "DealFinancingCoordinationStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "institution_name" TEXT,
    "last_contact_at" TIMESTAMP(3),
    "missing_info_flags" JSONB NOT NULL DEFAULT '[]',
    "lender_metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deal_bank_coordinations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "deal_bank_coordinations_deal_id_key" ON "deal_bank_coordinations"("deal_id");

ALTER TABLE "deal_bank_coordinations" ADD CONSTRAINT "deal_bank_coordinations_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "deal_notary_coordinations" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "package_checklist_json" JSONB NOT NULL DEFAULT '[]',
    "deed_readiness_notes" TEXT,
    "appointment_at" TIMESTAMP(3),
    "notary_firm_name" TEXT,
    "package_status" TEXT NOT NULL DEFAULT 'not_started',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deal_notary_coordinations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "deal_notary_coordinations_deal_id_key" ON "deal_notary_coordinations"("deal_id");

ALTER TABLE "deal_notary_coordinations" ADD CONSTRAINT "deal_notary_coordinations_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "deal_coordination_audit_logs" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actor_user_id" TEXT,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deal_coordination_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "deal_coordination_audit_logs_deal_id_created_at_idx" ON "deal_coordination_audit_logs"("deal_id", "created_at");
CREATE INDEX "deal_coordination_audit_logs_action_idx" ON "deal_coordination_audit_logs"("action");

ALTER TABLE "deal_coordination_audit_logs" ADD CONSTRAINT "deal_coordination_audit_logs_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
