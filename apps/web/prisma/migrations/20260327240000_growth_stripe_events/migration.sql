-- Stripe webhook dedupe + growth log columns

CREATE TABLE IF NOT EXISTS "stripe_events" (
    "event_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "stripe_events_pkey" PRIMARY KEY ("event_id")
);

ALTER TABLE "growth_stripe_webhook_logs" ADD COLUMN IF NOT EXISTS "booking_id" TEXT;
ALTER TABLE "growth_stripe_webhook_logs" ADD COLUMN IF NOT EXISTS "payment_intent_id" TEXT;
