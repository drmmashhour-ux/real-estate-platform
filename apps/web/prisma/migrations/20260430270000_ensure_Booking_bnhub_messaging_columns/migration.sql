-- Recovery: if an environment applied BNHub inquiry migrations against the wrong table name,
-- ensure columns exist on Prisma's "Booking" table (idempotent).
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "guest_last_read_booking_messages_at" TIMESTAMP(3);
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "host_last_read_booking_messages_at" TIMESTAMP(3);
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "bnhub_host_avg_booking_response_ms" INTEGER;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "bnhub_host_booking_response_samples" INTEGER NOT NULL DEFAULT 0;
