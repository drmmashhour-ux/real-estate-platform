-- Client intake profiles, required document checklist, audit events

CREATE TYPE "ClientIntakeStatus" AS ENUM (
  'NOT_STARTED',
  'IN_PROGRESS',
  'UNDER_REVIEW',
  'COMPLETE',
  'ON_HOLD'
);

CREATE TYPE "RequiredDocumentCategory" AS ENUM (
  'IDENTITY',
  'INCOME',
  'BANKING',
  'TAX',
  'RESIDENCY',
  'CREDIT',
  'EMPLOYMENT',
  'CORPORATE',
  'PROPERTY',
  'OTHER'
);

CREATE TYPE "RequiredDocumentStatus" AS ENUM (
  'REQUIRED',
  'REQUESTED',
  'UPLOADED',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED',
  'WAIVED'
);

CREATE TYPE "ClientIntakeEventType" AS ENUM (
  'INTAKE_CREATED',
  'INTAKE_UPDATED',
  'STATUS_CHANGED',
  'DOCUMENT_REQUESTED',
  'DOCUMENT_UPLOADED',
  'DOCUMENT_LINKED',
  'DOCUMENT_APPROVED',
  'DOCUMENT_REJECTED',
  'DOCUMENT_WAIVED',
  'NOTE_ADDED'
);

CREATE TABLE "client_intake_profiles" (
    "id" TEXT NOT NULL,
    "broker_client_id" TEXT NOT NULL,
    "user_id" TEXT,
    "legal_first_name" TEXT,
    "legal_last_name" TEXT,
    "date_of_birth" TIMESTAMP(3),
    "phone" TEXT,
    "email" TEXT,
    "employment_status" TEXT,
    "annual_income" DOUBLE PRECISION,
    "estimated_assets" DOUBLE PRECISION,
    "estimated_liabilities" DOUBLE PRECISION,
    "residency_status" TEXT,
    "citizenship_country" TEXT,
    "marital_status" TEXT,
    "current_address" TEXT,
    "city" TEXT,
    "province_state" TEXT,
    "postal_code" TEXT,
    "country" TEXT,
    "notes" TEXT,
    "status" "ClientIntakeStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_intake_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "client_intake_profiles_broker_client_id_key" ON "client_intake_profiles"("broker_client_id");

CREATE INDEX "client_intake_profiles_user_id_idx" ON "client_intake_profiles"("user_id");

CREATE TABLE "required_document_items" (
    "id" TEXT NOT NULL,
    "broker_client_id" TEXT NOT NULL,
    "intake_profile_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "RequiredDocumentCategory" NOT NULL,
    "status" "RequiredDocumentStatus" NOT NULL DEFAULT 'REQUIRED',
    "is_mandatory" BOOLEAN NOT NULL DEFAULT true,
    "requested_by_id" TEXT,
    "due_at" TIMESTAMP(3),
    "reviewed_by_id" TEXT,
    "linked_document_file_id" TEXT,
    "rejection_reason" TEXT,
    "notes" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "required_document_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "required_document_items_broker_client_id_idx" ON "required_document_items"("broker_client_id");
CREATE INDEX "required_document_items_intake_profile_id_idx" ON "required_document_items"("intake_profile_id");
CREATE INDEX "required_document_items_status_idx" ON "required_document_items"("status");
CREATE INDEX "required_document_items_linked_document_file_id_idx" ON "required_document_items"("linked_document_file_id");

CREATE TABLE "client_intake_events" (
    "id" TEXT NOT NULL,
    "broker_client_id" TEXT NOT NULL,
    "intake_profile_id" TEXT,
    "required_document_item_id" TEXT,
    "actor_id" TEXT,
    "type" "ClientIntakeEventType" NOT NULL,
    "message" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_intake_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "client_intake_events_broker_client_id_idx" ON "client_intake_events"("broker_client_id");
CREATE INDEX "client_intake_events_intake_profile_id_idx" ON "client_intake_events"("intake_profile_id");
CREATE INDEX "client_intake_events_required_document_item_id_idx" ON "client_intake_events"("required_document_item_id");

ALTER TABLE "client_intake_profiles" ADD CONSTRAINT "client_intake_profiles_broker_client_id_fkey" FOREIGN KEY ("broker_client_id") REFERENCES "broker_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "client_intake_profiles" ADD CONSTRAINT "client_intake_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "required_document_items" ADD CONSTRAINT "required_document_items_broker_client_id_fkey" FOREIGN KEY ("broker_client_id") REFERENCES "broker_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "required_document_items" ADD CONSTRAINT "required_document_items_intake_profile_id_fkey" FOREIGN KEY ("intake_profile_id") REFERENCES "client_intake_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "required_document_items" ADD CONSTRAINT "required_document_items_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "required_document_items" ADD CONSTRAINT "required_document_items_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "required_document_items" ADD CONSTRAINT "required_document_items_linked_document_file_id_fkey" FOREIGN KEY ("linked_document_file_id") REFERENCES "document_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "client_intake_events" ADD CONSTRAINT "client_intake_events_broker_client_id_fkey" FOREIGN KEY ("broker_client_id") REFERENCES "broker_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "client_intake_events" ADD CONSTRAINT "client_intake_events_intake_profile_id_fkey" FOREIGN KEY ("intake_profile_id") REFERENCES "client_intake_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "client_intake_events" ADD CONSTRAINT "client_intake_events_required_document_item_id_fkey" FOREIGN KEY ("required_document_item_id") REFERENCES "required_document_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "client_intake_events" ADD CONSTRAINT "client_intake_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
