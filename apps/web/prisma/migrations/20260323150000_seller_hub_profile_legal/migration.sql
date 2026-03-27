-- Seller Hub profile + legal accuracy on FSBO listing
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "seller_hub_onboarding_json" JSONB;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "seller_selling_mode" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "seller_onboarding_completed_at" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "seller_legal_accuracy_accepted_at" TIMESTAMP(3);

ALTER TABLE "fsbo_listings" ADD COLUMN IF NOT EXISTS "legal_accuracy_accepted_at" TIMESTAMP(3);
