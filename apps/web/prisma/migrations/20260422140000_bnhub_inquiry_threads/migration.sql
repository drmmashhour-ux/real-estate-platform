-- BNHUB pre-booking inquiry threads + booking chat read receipts / host response stats

-- Prisma model `Booking` maps to table "Booking" (see baseline), not "bookings".
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "guest_last_read_booking_messages_at" TIMESTAMP(3);
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "host_last_read_booking_messages_at" TIMESTAMP(3);
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "bnhub_host_avg_booking_response_ms" INTEGER;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "bnhub_host_booking_response_samples" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "bnhub_inquiry_threads" (
    "id" TEXT NOT NULL,
    "short_term_listing_id" TEXT NOT NULL,
    "guest_user_id" TEXT NOT NULL,
    "host_user_id" TEXT NOT NULL,
    "last_message_at" TIMESTAMP(3),
    "guest_last_read_at" TIMESTAMP(3),
    "host_last_read_at" TIMESTAMP(3),
    "host_avg_response_ms" INTEGER,
    "host_response_samples" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bnhub_inquiry_threads_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "bnhub_inquiry_threads_short_term_listing_id_guest_user_id_key" ON "bnhub_inquiry_threads"("short_term_listing_id", "guest_user_id");
CREATE INDEX IF NOT EXISTS "bnhub_inquiry_threads_host_user_id_idx" ON "bnhub_inquiry_threads"("host_user_id");
CREATE INDEX IF NOT EXISTS "bnhub_inquiry_threads_guest_user_id_idx" ON "bnhub_inquiry_threads"("guest_user_id");
CREATE INDEX IF NOT EXISTS "bnhub_inquiry_threads_last_message_at_idx" ON "bnhub_inquiry_threads"("last_message_at");

ALTER TABLE "bnhub_inquiry_threads" ADD CONSTRAINT "bnhub_inquiry_threads_short_term_listing_id_fkey" FOREIGN KEY ("short_term_listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bnhub_inquiry_threads" ADD CONSTRAINT "bnhub_inquiry_threads_guest_user_id_fkey" FOREIGN KEY ("guest_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bnhub_inquiry_threads" ADD CONSTRAINT "bnhub_inquiry_threads_host_user_id_fkey" FOREIGN KEY ("host_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "bnhub_inquiry_messages" (
    "id" TEXT NOT NULL,
    "thread_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bnhub_inquiry_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "bnhub_inquiry_messages_thread_id_idx" ON "bnhub_inquiry_messages"("thread_id");
CREATE INDEX IF NOT EXISTS "bnhub_inquiry_messages_sender_id_idx" ON "bnhub_inquiry_messages"("sender_id");

ALTER TABLE "bnhub_inquiry_messages" ADD CONSTRAINT "bnhub_inquiry_messages_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "bnhub_inquiry_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bnhub_inquiry_messages" ADD CONSTRAINT "bnhub_inquiry_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
