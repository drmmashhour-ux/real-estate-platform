-- Client-generated id for offline queue dedup + idempotent POST.

ALTER TABLE "sybnb_messages" ADD COLUMN IF NOT EXISTS "client_id" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "sybnb_messages_booking_sender_client_uidx"
  ON "sybnb_messages" ("booking_id", "sender_id", "client_id")
  WHERE "client_id" IS NOT NULL;
