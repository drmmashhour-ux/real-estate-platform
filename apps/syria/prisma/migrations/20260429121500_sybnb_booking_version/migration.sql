-- SYBNB booking optimistic concurrency (`version`).
ALTER TABLE "sybnb_bookings" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;
