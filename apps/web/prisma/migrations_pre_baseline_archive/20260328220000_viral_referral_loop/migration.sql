-- Viral growth loop: referral lifecycle + public attribution code on each row

ALTER TABLE "referrals" ADD COLUMN IF NOT EXISTS "referral_public_code" TEXT;

ALTER TABLE "referrals" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'joined';

ALTER TABLE "referrals" ADD COLUMN IF NOT EXISTS "reward_given" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "referrals_referral_public_code_idx" ON "referrals"("referral_public_code");

CREATE INDEX IF NOT EXISTS "referrals_status_idx" ON "referrals"("status");

-- Backfill viral rows: code was the sharer’s public code; keep as public attribution.
UPDATE "referrals"
SET "referral_public_code" = "code"
WHERE "referral_public_code" IS NULL AND "usedByUserId" IS NOT NULL;
