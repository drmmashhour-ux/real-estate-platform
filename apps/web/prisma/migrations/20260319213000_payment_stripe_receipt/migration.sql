-- Stripe Checkout receipt + session amounts on BNHub payment rows
ALTER TABLE "payments" ADD COLUMN "stripe_receipt_url" TEXT;
ALTER TABLE "payments" ADD COLUMN "stripe_checkout_amount_cents" INTEGER;
ALTER TABLE "payments" ADD COLUMN "stripe_checkout_currency" TEXT;
