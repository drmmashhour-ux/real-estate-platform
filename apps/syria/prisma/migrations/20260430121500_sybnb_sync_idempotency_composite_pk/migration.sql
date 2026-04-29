-- Composite PK (client_request_id, client_id) for multi-device idempotency.

ALTER TABLE "sybnb_sync_idempotency" ADD COLUMN IF NOT EXISTS "client_id" VARCHAR(128) NOT NULL DEFAULT '__legacy__';

ALTER TABLE "sybnb_sync_idempotency" DROP CONSTRAINT "sybnb_sync_idempotency_pkey";

ALTER TABLE "sybnb_sync_idempotency" ADD CONSTRAINT "sybnb_sync_idempotency_pkey" PRIMARY KEY ("client_request_id","client_id");
