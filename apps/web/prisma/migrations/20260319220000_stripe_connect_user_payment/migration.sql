-- Stripe Connect (host) + platform fee on Payment
ALTER TABLE "User" ADD COLUMN "stripe_account_id" TEXT;
ALTER TABLE "User" ADD COLUMN "stripe_onboarding_complete" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "payments" ADD COLUMN "platform_fee_cents" INTEGER;
