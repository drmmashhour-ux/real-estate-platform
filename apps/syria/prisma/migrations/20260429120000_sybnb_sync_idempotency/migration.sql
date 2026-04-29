-- SYBNB unified offline sync — idempotency keys for client replay (see `sync-engine.ts`)

CREATE TABLE IF NOT EXISTS "sybnb_sync_idempotency" (
    "client_request_id" VARCHAR(128) NOT NULL,
    "user_id" TEXT NOT NULL,
    "kind" VARCHAR(32) NOT NULL,
    "booking_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sybnb_sync_idempotency_pkey" PRIMARY KEY ("client_request_id")
);

CREATE INDEX IF NOT EXISTS "sybnb_sync_idempotency_user_id_idx" ON "sybnb_sync_idempotency"("user_id");

CREATE INDEX IF NOT EXISTS "sybnb_sync_idempotency_booking_id_idx" ON "sybnb_sync_idempotency"("booking_id");
