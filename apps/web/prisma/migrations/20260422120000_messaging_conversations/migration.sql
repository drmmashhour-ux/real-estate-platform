-- In-app messaging: conversations, participants, messages, events

CREATE TYPE "ConversationType" AS ENUM (
  'DIRECT',
  'LISTING',
  'OFFER',
  'CONTRACT',
  'APPOINTMENT',
  'CLIENT_THREAD',
  'SUPPORT'
);

CREATE TYPE "MessageType" AS ENUM (
  'TEXT',
  'SYSTEM',
  'NOTE'
);

CREATE TYPE "MessageEventType" AS ENUM (
  'CONVERSATION_CREATED',
  'PARTICIPANT_ADDED',
  'MESSAGE_SENT',
  'MESSAGE_EDITED',
  'MESSAGE_DELETED',
  'CONVERSATION_ARCHIVED',
  'READ'
);

CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "type" "ConversationType" NOT NULL DEFAULT 'DIRECT',
    "listing_id" TEXT,
    "offer_id" TEXT,
    "contract_id" TEXT,
    "appointment_id" TEXT,
    "broker_client_id" TEXT,
    "created_by_id" TEXT,
    "subject" TEXT,
    "last_message_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "conversation_participants" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role_label" TEXT,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "last_read_at" TIMESTAMP(3),
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_participants_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "message_type" "MessageType" NOT NULL DEFAULT 'TEXT',
    "metadata" JSONB,
    "edited_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "message_events" (
    "id" TEXT NOT NULL,
    "message_id" TEXT,
    "conversation_id" TEXT NOT NULL,
    "actor_id" TEXT,
    "type" "MessageEventType" NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_events_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "conversations" ADD CONSTRAINT "conversations_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "conversations" ADD CONSTRAINT "conversations_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "conversations" ADD CONSTRAINT "conversations_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "listing_offers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "conversations" ADD CONSTRAINT "conversations_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "conversations" ADD CONSTRAINT "conversations_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "conversations" ADD CONSTRAINT "conversations_broker_client_id_fkey" FOREIGN KEY ("broker_client_id") REFERENCES "broker_clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "message_events" ADD CONSTRAINT "message_events_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "message_events" ADD CONSTRAINT "message_events_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "message_events" ADD CONSTRAINT "message_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX "conversation_participants_conversation_id_user_id_key" ON "conversation_participants"("conversation_id", "user_id");

CREATE INDEX "conversations_listing_id_idx" ON "conversations"("listing_id");
CREATE INDEX "conversations_offer_id_idx" ON "conversations"("offer_id");
CREATE INDEX "conversations_contract_id_idx" ON "conversations"("contract_id");
CREATE INDEX "conversations_appointment_id_idx" ON "conversations"("appointment_id");
CREATE INDEX "conversations_broker_client_id_idx" ON "conversations"("broker_client_id");
CREATE INDEX "conversations_last_message_at_idx" ON "conversations"("last_message_at");

CREATE INDEX "conversation_participants_conversation_id_idx" ON "conversation_participants"("conversation_id");
CREATE INDEX "conversation_participants_user_id_idx" ON "conversation_participants"("user_id");

CREATE INDEX "messages_conversation_id_idx" ON "messages"("conversation_id");
CREATE INDEX "messages_sender_id_idx" ON "messages"("sender_id");
CREATE INDEX "messages_created_at_idx" ON "messages"("created_at");

CREATE INDEX "message_events_conversation_id_idx" ON "message_events"("conversation_id");
CREATE INDEX "message_events_message_id_idx" ON "message_events"("message_id");
