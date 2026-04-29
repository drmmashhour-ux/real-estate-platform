-- SYBNB production scale — supporting indexes for listing scans, timelines, and pool migration tooling.

CREATE INDEX IF NOT EXISTS "sybnb_bookings_created_at_idx" ON "sybnb_bookings" ("created_at");

CREATE INDEX IF NOT EXISTS "sybnb_bookings_updated_at_idx" ON "sybnb_bookings" ("updated_at");

CREATE INDEX IF NOT EXISTS "sybnb_messages_sender_id_idx" ON "sybnb_messages" ("sender_id");

CREATE INDEX IF NOT EXISTS "sybnb_messages_created_at_idx" ON "sybnb_messages" ("created_at");

CREATE INDEX IF NOT EXISTS "sybnb_sync_idempotency_created_at_idx" ON "sybnb_sync_idempotency" ("created_at");
