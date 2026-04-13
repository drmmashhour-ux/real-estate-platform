-- LECIPM listing-linked broker messaging (guest + customer inbox; distinct from CRM Conversation/Message)

CREATE TYPE "LecipmBrokerThreadStatus" AS ENUM ('open', 'replied', 'closed');
CREATE TYPE "LecipmBrokerThreadSource" AS ENUM ('listing_contact', 'broker_profile', 'general_inquiry');
CREATE TYPE "LecipmBrokerMessageSenderRole" AS ENUM ('customer', 'broker', 'admin', 'guest');

CREATE TABLE "lecipm_broker_listing_threads" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT,
    "broker_user_id" TEXT NOT NULL,
    "customer_user_id" TEXT,
    "guest_name" TEXT,
    "guest_email" TEXT,
    "guest_token_hash" TEXT,
    "subject" VARCHAR(512),
    "status" "LecipmBrokerThreadStatus" NOT NULL DEFAULT 'open',
    "source" "LecipmBrokerThreadSource" NOT NULL,
    "last_message_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lecipm_broker_listing_threads_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "lecipm_broker_listing_threads_guest_token_hash_key" ON "lecipm_broker_listing_threads"("guest_token_hash");

CREATE INDEX "lecipm_broker_listing_threads_broker_user_id_idx" ON "lecipm_broker_listing_threads"("broker_user_id");
CREATE INDEX "lecipm_broker_listing_threads_customer_user_id_idx" ON "lecipm_broker_listing_threads"("customer_user_id");
CREATE INDEX "lecipm_broker_listing_threads_listing_id_idx" ON "lecipm_broker_listing_threads"("listing_id");
CREATE INDEX "lecipm_broker_listing_threads_status_idx" ON "lecipm_broker_listing_threads"("status");
CREATE INDEX "lecipm_broker_listing_threads_last_message_at_idx" ON "lecipm_broker_listing_threads"("last_message_at");

ALTER TABLE "lecipm_broker_listing_threads" ADD CONSTRAINT "lecipm_broker_listing_threads_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "lecipm_broker_listing_threads" ADD CONSTRAINT "lecipm_broker_listing_threads_broker_user_id_fkey" FOREIGN KEY ("broker_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lecipm_broker_listing_threads" ADD CONSTRAINT "lecipm_broker_listing_threads_customer_user_id_fkey" FOREIGN KEY ("customer_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "lecipm_broker_listing_messages" (
    "id" TEXT NOT NULL,
    "thread_id" TEXT NOT NULL,
    "sender_user_id" TEXT,
    "sender_role" "LecipmBrokerMessageSenderRole" NOT NULL,
    "body" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lecipm_broker_listing_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lecipm_broker_listing_messages_thread_id_idx" ON "lecipm_broker_listing_messages"("thread_id");
CREATE INDEX "lecipm_broker_listing_messages_sender_user_id_idx" ON "lecipm_broker_listing_messages"("sender_user_id");
CREATE INDEX "lecipm_broker_listing_messages_created_at_idx" ON "lecipm_broker_listing_messages"("created_at");

ALTER TABLE "lecipm_broker_listing_messages" ADD CONSTRAINT "lecipm_broker_listing_messages_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "lecipm_broker_listing_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lecipm_broker_listing_messages" ADD CONSTRAINT "lecipm_broker_listing_messages_sender_user_id_fkey" FOREIGN KEY ("sender_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "lecipm_broker_listing_participants" (
    "id" TEXT NOT NULL,
    "thread_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" VARCHAR(24) NOT NULL,
    "last_read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lecipm_broker_listing_participants_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "lecipm_broker_listing_participants_thread_id_user_id_key" ON "lecipm_broker_listing_participants"("thread_id", "user_id");
CREATE INDEX "lecipm_broker_listing_participants_thread_id_idx" ON "lecipm_broker_listing_participants"("thread_id");
CREATE INDEX "lecipm_broker_listing_participants_user_id_idx" ON "lecipm_broker_listing_participants"("user_id");

ALTER TABLE "lecipm_broker_listing_participants" ADD CONSTRAINT "lecipm_broker_listing_participants_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "lecipm_broker_listing_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lecipm_broker_listing_participants" ADD CONSTRAINT "lecipm_broker_listing_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
