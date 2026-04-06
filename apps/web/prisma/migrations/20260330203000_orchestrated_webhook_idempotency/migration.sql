-- Orchestration reconciliation: persist Stripe PaymentIntent id on orchestrated rows.

ALTER TABLE "orchestrated_payments" ADD COLUMN IF NOT EXISTS "stripe_payment_intent_id" TEXT;
CREATE INDEX IF NOT EXISTS "orchestrated_payments_stripe_payment_intent_id_idx" ON "orchestrated_payments"("stripe_payment_intent_id");
