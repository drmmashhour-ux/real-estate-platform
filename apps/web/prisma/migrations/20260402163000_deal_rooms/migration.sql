-- LECIPM Deal Room — transaction workspace

CREATE TYPE "DealRoomStage" AS ENUM (
  'new_interest',
  'qualified',
  'visit_scheduled',
  'visit_completed',
  'offer_preparing',
  'offer_submitted',
  'negotiating',
  'accepted',
  'documents_pending',
  'payment_pending',
  'closed',
  'lost'
);

CREATE TYPE "DealPriorityLabel" AS ENUM ('low', 'medium', 'high');

CREATE TYPE "DealTaskStatus" AS ENUM ('todo', 'in_progress', 'done', 'blocked');

CREATE TYPE "DealDocumentRefType" AS ENUM ('uploaded_file', 'legal_form_draft', 'external');

CREATE TYPE "DealDocumentStatus" AS ENUM ('requested', 'in_progress', 'review_required', 'completed');

CREATE TYPE "DealPaymentType" AS ENUM ('listing_fee', 'booking_payment', 'deposit', 'commission', 'lead_fee');

CREATE TYPE "DealPaymentStatus" AS ENUM ('pending', 'paid', 'failed', 'waived');

CREATE TYPE "DealParticipantRole" AS ENUM ('broker', 'buyer', 'seller', 'client', 'admin', 'guest');

CREATE TABLE "deal_rooms" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "listing_id" TEXT,
    "broker_user_id" TEXT NOT NULL,
    "lead_id" TEXT,
    "thread_id" TEXT,
    "customer_user_id" TEXT,
    "guest_name" TEXT,
    "guest_email" TEXT,
    "stage" "DealRoomStage" NOT NULL DEFAULT 'new_interest',
    "priority_label" "DealPriorityLabel" NOT NULL DEFAULT 'medium',
    "summary" TEXT,
    "next_action" TEXT,
    "next_follow_up_at" TIMESTAMP(3),
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deal_rooms_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "deal_rooms_lead_id_key" ON "deal_rooms"("lead_id");
CREATE UNIQUE INDEX "deal_rooms_thread_id_key" ON "deal_rooms"("thread_id");

CREATE INDEX "deal_rooms_broker_user_id_idx" ON "deal_rooms"("broker_user_id");
CREATE INDEX "deal_rooms_listing_id_idx" ON "deal_rooms"("listing_id");
CREATE INDEX "deal_rooms_stage_idx" ON "deal_rooms"("stage");
CREATE INDEX "deal_rooms_next_follow_up_at_idx" ON "deal_rooms"("next_follow_up_at");

ALTER TABLE "deal_rooms" ADD CONSTRAINT "deal_rooms_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "deal_rooms" ADD CONSTRAINT "deal_rooms_broker_user_id_fkey" FOREIGN KEY ("broker_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "deal_rooms" ADD CONSTRAINT "deal_rooms_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "deal_rooms" ADD CONSTRAINT "deal_rooms_customer_user_id_fkey" FOREIGN KEY ("customer_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "deal_room_participants" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "deal_room_id" UUID NOT NULL,
    "user_id" TEXT,
    "role" "DealParticipantRole" NOT NULL,
    "display_name" TEXT,
    "email" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deal_room_participants_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "deal_room_participants_deal_room_id_idx" ON "deal_room_participants"("deal_room_id");
CREATE INDEX "deal_room_participants_user_id_idx" ON "deal_room_participants"("user_id");

ALTER TABLE "deal_room_participants" ADD CONSTRAINT "deal_room_participants_deal_room_id_fkey" FOREIGN KEY ("deal_room_id") REFERENCES "deal_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "deal_room_participants" ADD CONSTRAINT "deal_room_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "deal_room_tasks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "deal_room_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "DealTaskStatus" NOT NULL DEFAULT 'todo',
    "assigned_user_id" TEXT,
    "due_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deal_room_tasks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "deal_room_tasks_deal_room_id_idx" ON "deal_room_tasks"("deal_room_id");
CREATE INDEX "deal_room_tasks_status_idx" ON "deal_room_tasks"("status");
CREATE INDEX "deal_room_tasks_due_at_idx" ON "deal_room_tasks"("due_at");

ALTER TABLE "deal_room_tasks" ADD CONSTRAINT "deal_room_tasks_deal_room_id_fkey" FOREIGN KEY ("deal_room_id") REFERENCES "deal_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "deal_room_tasks" ADD CONSTRAINT "deal_room_tasks_assigned_user_id_fkey" FOREIGN KEY ("assigned_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "deal_room_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "deal_room_id" UUID NOT NULL,
    "event_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "metadata_json" JSONB NOT NULL DEFAULT '{}',
    "created_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deal_room_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "deal_room_events_deal_room_id_idx" ON "deal_room_events"("deal_room_id");
CREATE INDEX "deal_room_events_created_at_idx" ON "deal_room_events"("created_at");

ALTER TABLE "deal_room_events" ADD CONSTRAINT "deal_room_events_deal_room_id_fkey" FOREIGN KEY ("deal_room_id") REFERENCES "deal_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "deal_room_events" ADD CONSTRAINT "deal_room_events_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "deal_room_documents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "deal_room_id" UUID NOT NULL,
    "document_type" TEXT NOT NULL,
    "document_ref_type" "DealDocumentRefType" NOT NULL,
    "document_ref_id" TEXT,
    "status" "DealDocumentStatus" NOT NULL DEFAULT 'requested',
    "title" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deal_room_documents_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "deal_room_documents_deal_room_id_idx" ON "deal_room_documents"("deal_room_id");
CREATE INDEX "deal_room_documents_status_idx" ON "deal_room_documents"("status");

ALTER TABLE "deal_room_documents" ADD CONSTRAINT "deal_room_documents_deal_room_id_fkey" FOREIGN KEY ("deal_room_id") REFERENCES "deal_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "deal_room_payments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "deal_room_id" UUID NOT NULL,
    "payment_type" "DealPaymentType" NOT NULL,
    "status" "DealPaymentStatus" NOT NULL DEFAULT 'pending',
    "amount_cents" INTEGER,
    "currency" TEXT,
    "payment_ref" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deal_room_payments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "deal_room_payments_deal_room_id_idx" ON "deal_room_payments"("deal_room_id");
CREATE INDEX "deal_room_payments_status_idx" ON "deal_room_payments"("status");
CREATE INDEX "deal_room_payments_payment_type_idx" ON "deal_room_payments"("payment_type");

ALTER TABLE "deal_room_payments" ADD CONSTRAINT "deal_room_payments_deal_room_id_fkey" FOREIGN KEY ("deal_room_id") REFERENCES "deal_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
