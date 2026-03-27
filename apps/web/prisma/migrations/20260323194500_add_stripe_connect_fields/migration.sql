-- Stripe Connect fields (User + Payment) — baseline / follow-up to 20260319220000
-- Idempotent adds for environments that may not have applied the earlier migration.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "stripe_account_id" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "stripe_onboarding_complete" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "platform_fee_cents" INTEGER;

-- hostPayoutCents optional in schema (finalized at checkout / webhook in some flows)
ALTER TABLE "payments" ALTER COLUMN "hostPayoutCents" DROP NOT NULL;
