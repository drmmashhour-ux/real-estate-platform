-- LECIPM Green Score & Optimization Program (internal — not third-party eco-labels).

ALTER TABLE "fsbo_listings" ADD COLUMN IF NOT EXISTS "lecipm_green_internal_score" INTEGER;
ALTER TABLE "fsbo_listings" ADD COLUMN IF NOT EXISTS "lecipm_green_certified_at" TIMESTAMP(3);
ALTER TABLE "fsbo_listings" ADD COLUMN IF NOT EXISTS "lecipm_green_program_tier" VARCHAR(16) NOT NULL DEFAULT 'none';
ALTER TABLE "fsbo_listings" ADD COLUMN IF NOT EXISTS "lecipm_green_metadata_json" JSONB;
