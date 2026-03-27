-- ImmoContactEventType — additional audit events
DO $$ BEGIN ALTER TYPE "ImmoContactEventType" ADD VALUE 'CONTACT_FORM_SUBMITTED'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "ImmoContactEventType" ADD VALUE 'CONVERSATION_STARTED'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "ImmoContactEventType" ADD VALUE 'OFFER_STARTED'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "ImmoContactEventType" ADD VALUE 'DEAL_LINKED'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ImmoContactLog — hub + counterparty / broker
ALTER TABLE "immo_contact_logs" ADD COLUMN IF NOT EXISTS "hub" TEXT;
ALTER TABLE "immo_contact_logs" ADD COLUMN IF NOT EXISTS "target_user_id" TEXT;
ALTER TABLE "immo_contact_logs" ADD COLUMN IF NOT EXISTS "broker_id" TEXT;

CREATE INDEX IF NOT EXISTS "immo_contact_logs_hub_idx" ON "immo_contact_logs"("hub");
CREATE INDEX IF NOT EXISTS "immo_contact_logs_target_user_id_idx" ON "immo_contact_logs"("target_user_id");
CREATE INDEX IF NOT EXISTS "immo_contact_logs_broker_id_idx" ON "immo_contact_logs"("broker_id");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'immo_contact_logs_target_user_id_fkey') THEN
    ALTER TABLE "immo_contact_logs"
      ADD CONSTRAINT "immo_contact_logs_target_user_id_fkey"
      FOREIGN KEY ("target_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'immo_contact_logs_broker_id_fkey') THEN
    ALTER TABLE "immo_contact_logs"
      ADD CONSTRAINT "immo_contact_logs_broker_id_fkey"
      FOREIGN KEY ("broker_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- BNHub Review — updatedAt for edit traceability
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
UPDATE "Review" SET "updatedAt" = "createdAt" WHERE "updatedAt" IS NULL OR "updatedAt" < "createdAt";
