-- Growth observability: optional booking + PI on webhook log rows
ALTER TABLE "growth_stripe_webhook_logs" ADD COLUMN IF NOT EXISTS "booking_id" TEXT;
ALTER TABLE "growth_stripe_webhook_logs" ADD COLUMN IF NOT EXISTS "payment_intent_id" TEXT;
CREATE INDEX IF NOT EXISTS "growth_stripe_webhook_logs_booking_id_idx" ON "growth_stripe_webhook_logs"("booking_id");
