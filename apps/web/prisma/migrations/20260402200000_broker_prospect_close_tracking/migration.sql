ALTER TABLE "broker_prospects" ADD COLUMN IF NOT EXISTS "last_close_message_type" TEXT;
ALTER TABLE "broker_prospects" ADD COLUMN IF NOT EXISTS "last_close_contact_at" TIMESTAMP(3);
