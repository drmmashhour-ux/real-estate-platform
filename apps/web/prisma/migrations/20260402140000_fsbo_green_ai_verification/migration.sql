-- LECIPM AI Green Score — verification band + confidence (AI vs document-supported).

ALTER TABLE "fsbo_listings" ADD COLUMN IF NOT EXISTS "lecipm_green_ai_label" VARCHAR(24);
ALTER TABLE "fsbo_listings" ADD COLUMN IF NOT EXISTS "lecipm_green_verification_level" VARCHAR(32);
ALTER TABLE "fsbo_listings" ADD COLUMN IF NOT EXISTS "lecipm_green_confidence" INTEGER;
