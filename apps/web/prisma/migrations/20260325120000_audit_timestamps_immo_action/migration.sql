-- ImmoContactEventType: DEAL_STARTED
DO $$ BEGIN
  ALTER TYPE "ImmoContactEventType" ADD VALUE 'DEAL_STARTED';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ImmoContactLog: event instant + row update tracking (admin notes bump updated_at)
ALTER TABLE "immo_contact_logs" ADD COLUMN IF NOT EXISTS "action_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
UPDATE "immo_contact_logs" SET "action_at" = "created_at";

ALTER TABLE "immo_contact_logs" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
UPDATE "immo_contact_logs" SET "updated_at" = COALESCE("admin_noted_at", "created_at");

CREATE INDEX IF NOT EXISTS "immo_contact_logs_action_at_idx" ON "immo_contact_logs"("action_at");

-- Subscription invoices + CRM listing + leads + chat messages
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
UPDATE "Invoice" SET "updatedAt" = "createdAt";

ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
UPDATE "Listing" SET "updatedAt" = "createdAt";

ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
UPDATE "Lead" SET "updated_at" = "createdAt";

ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
UPDATE "messages" SET "updated_at" = "created_at";
