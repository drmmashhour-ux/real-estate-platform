-- Internal notifications + action queue (idempotent-ish: drop types if re-run will fail — use fresh DB or adjust)

CREATE TYPE "NotificationType" AS ENUM (
  'MESSAGE', 'OFFER', 'CONTRACT', 'APPOINTMENT', 'DOCUMENT', 'INTAKE', 'CRM', 'SYSTEM', 'TASK', 'REMINDER'
);

CREATE TYPE "NotificationStatus" AS ENUM ('UNREAD', 'READ', 'ARCHIVED');

CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

CREATE TYPE "ActionQueueItemType" AS ENUM (
  'REVIEW_DOCUMENT', 'REVIEW_OFFER', 'REVIEW_CONTRACT', 'RESPOND_MESSAGE', 'CONFIRM_APPOINTMENT',
  'FOLLOW_UP_CLIENT', 'COMPLETE_INTAKE', 'SIGN_CONTRACT', 'UPLOAD_REQUIRED_DOCUMENT',
  'REVIEW_COUNTER_OFFER', 'INTERNAL_TASK', 'SYSTEM_ACTION'
);

CREATE TYPE "ActionQueueItemStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'DONE', 'DISMISSED', 'ARCHIVED');

CREATE TYPE "NotificationEventType" AS ENUM (
  'CREATED', 'READ', 'ARCHIVED', 'ACTION_COMPLETED', 'ACTION_DISMISSED', 'STATUS_CHANGED'
);

CREATE TABLE "notifications" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "type" "NotificationType" NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT,
  "status" "NotificationStatus" NOT NULL DEFAULT 'UNREAD',
  "priority" "NotificationPriority" NOT NULL DEFAULT 'NORMAL',
  "action_url" TEXT,
  "action_label" TEXT,
  "actor_id" TEXT,
  "listing_id" TEXT,
  "broker_client_id" TEXT,
  "intake_profile_id" TEXT,
  "required_document_item_id" TEXT,
  "offer_id" TEXT,
  "contract_id" TEXT,
  "appointment_id" TEXT,
  "conversation_id" TEXT,
  "document_file_id" TEXT,
  "metadata" JSONB,
  "read_at" TIMESTAMP(3),
  "archived_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "action_queue_items" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "type" "ActionQueueItemType" NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "status" "ActionQueueItemStatus" NOT NULL DEFAULT 'OPEN',
  "priority" "NotificationPriority" NOT NULL DEFAULT 'NORMAL',
  "due_at" TIMESTAMP(3),
  "completed_at" TIMESTAMP(3),
  "source_key" TEXT,
  "source_type" TEXT,
  "source_id" TEXT,
  "action_url" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "action_queue_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "notification_events" (
  "id" TEXT NOT NULL,
  "notification_id" TEXT,
  "action_queue_item_id" TEXT,
  "actor_id" TEXT,
  "type" "NotificationEventType" NOT NULL,
  "message" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "notification_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");
CREATE INDEX "notifications_status_idx" ON "notifications"("status");
CREATE INDEX "notifications_priority_idx" ON "notifications"("priority");
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");
CREATE INDEX "notifications_offer_id_idx" ON "notifications"("offer_id");
CREATE INDEX "notifications_contract_id_idx" ON "notifications"("contract_id");
CREATE INDEX "notifications_appointment_id_idx" ON "notifications"("appointment_id");
CREATE INDEX "notifications_conversation_id_idx" ON "notifications"("conversation_id");

CREATE INDEX "action_queue_items_user_id_idx" ON "action_queue_items"("user_id");
CREATE INDEX "action_queue_items_status_idx" ON "action_queue_items"("status");
CREATE INDEX "action_queue_items_priority_idx" ON "action_queue_items"("priority");
CREATE INDEX "action_queue_items_due_at_idx" ON "action_queue_items"("due_at");
CREATE INDEX "action_queue_items_source_type_source_id_idx" ON "action_queue_items"("source_type", "source_id");

CREATE INDEX "notification_events_notification_id_idx" ON "notification_events"("notification_id");
CREATE INDEX "notification_events_action_queue_item_id_idx" ON "notification_events"("action_queue_item_id");

ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "action_queue_items" ADD CONSTRAINT "action_queue_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "notification_events" ADD CONSTRAINT "notification_events_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notification_events" ADD CONSTRAINT "notification_events_action_queue_item_id_fkey" FOREIGN KEY ("action_queue_item_id") REFERENCES "action_queue_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notification_events" ADD CONSTRAINT "notification_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
