-- AlterTable
ALTER TABLE "manager_ai_host_autopilot_settings" ADD COLUMN "auto_guest_messaging_enabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "manager_ai_host_autopilot_settings" ADD COLUMN "guest_message_mode" VARCHAR(24) NOT NULL DEFAULT 'draft_only';
ALTER TABLE "manager_ai_host_autopilot_settings" ADD COLUMN "guest_message_triggers_json" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "manager_ai_host_autopilot_settings" ADD COLUMN "host_internal_checklist_enabled" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "bnhub_automated_host_message_logs" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "host_id" TEXT NOT NULL,
    "guest_id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "message_type" VARCHAR(64) NOT NULL,
    "trigger_type" VARCHAR(64) NOT NULL,
    "locale" VARCHAR(8) NOT NULL DEFAULT 'en',
    "content" TEXT NOT NULL,
    "status" VARCHAR(24) NOT NULL,
    "recipient" VARCHAR(24) NOT NULL DEFAULT 'guest',
    "metadata_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bnhub_automated_host_message_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bnhub_automated_host_message_logs_booking_id_created_at_idx" ON "bnhub_automated_host_message_logs"("booking_id", "created_at");

-- CreateIndex
CREATE INDEX "bnhub_automated_host_message_logs_host_id_created_at_idx" ON "bnhub_automated_host_message_logs"("host_id", "created_at");

-- CreateIndex
CREATE INDEX "bnhub_automated_host_message_logs_guest_id_created_at_idx" ON "bnhub_automated_host_message_logs"("guest_id", "created_at");

-- AddForeignKey
ALTER TABLE "bnhub_automated_host_message_logs" ADD CONSTRAINT "bnhub_automated_host_message_logs_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_automated_host_message_logs" ADD CONSTRAINT "bnhub_automated_host_message_logs_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_automated_host_message_logs" ADD CONSTRAINT "bnhub_automated_host_message_logs_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_automated_host_message_logs" ADD CONSTRAINT "bnhub_automated_host_message_logs_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
