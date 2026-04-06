-- Mortgage lead contact unlock: pricing, unlock state, audit table, broker aggregates

ALTER TABLE "mortgage_brokers" ADD COLUMN IF NOT EXISTS "total_lead_unlock_revenue" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "mortgage_brokers" ADD COLUMN IF NOT EXISTS "total_lead_unlocks" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "mortgage_requests" ADD COLUMN IF NOT EXISTS "lead_value" DOUBLE PRECISION NOT NULL DEFAULT 35;
ALTER TABLE "mortgage_requests" ADD COLUMN IF NOT EXISTS "contact_unlocked" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "mortgage_requests" ADD COLUMN IF NOT EXISTS "unlocked_by_broker_id" TEXT;
ALTER TABLE "mortgage_requests" ADD COLUMN IF NOT EXISTS "contact_unlocked_at" TIMESTAMP(3);

UPDATE "mortgage_requests" SET "contact_unlocked" = true WHERE "is_purchased_lead" = true AND "contact_unlocked" = false;

UPDATE "mortgage_requests" SET "lead_value" = 50 WHERE "intent_level" = 'high';
UPDATE "mortgage_requests" SET "lead_value" = 20 WHERE "intent_level" = 'low';
UPDATE "mortgage_requests" SET "lead_value" = 35 WHERE "intent_level" = 'medium';

CREATE TABLE IF NOT EXISTS "mortgage_lead_unlocks" (
    "id" TEXT NOT NULL,
    "mortgage_request_id" TEXT NOT NULL,
    "broker_id" TEXT NOT NULL,
    "amount_cents" INTEGER NOT NULL DEFAULT 0,
    "source" TEXT NOT NULL DEFAULT 'paid',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mortgage_lead_unlocks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "mortgage_lead_unlocks_mortgage_request_id_key" ON "mortgage_lead_unlocks"("mortgage_request_id");
CREATE INDEX IF NOT EXISTS "mortgage_lead_unlocks_broker_id_created_at_idx" ON "mortgage_lead_unlocks"("broker_id", "created_at");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'mortgage_lead_unlocks_mortgage_request_id_fkey'
  ) THEN
    ALTER TABLE "mortgage_lead_unlocks"
      ADD CONSTRAINT "mortgage_lead_unlocks_mortgage_request_id_fkey"
      FOREIGN KEY ("mortgage_request_id") REFERENCES "mortgage_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'mortgage_lead_unlocks_broker_id_fkey'
  ) THEN
    ALTER TABLE "mortgage_lead_unlocks"
      ADD CONSTRAINT "mortgage_lead_unlocks_broker_id_fkey"
      FOREIGN KEY ("broker_id") REFERENCES "mortgage_brokers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
