-- AlterTable
ALTER TABLE "fsbo_listings" ADD COLUMN IF NOT EXISTS "noise_level" TEXT;
ALTER TABLE "fsbo_listings" ADD COLUMN IF NOT EXISTS "family_friendly" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "fsbo_listings" ADD COLUMN IF NOT EXISTS "kids_allowed" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "fsbo_listings" ADD COLUMN IF NOT EXISTS "party_allowed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "fsbo_listings" ADD COLUMN IF NOT EXISTS "smoking_allowed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "fsbo_listings" ADD COLUMN IF NOT EXISTS "pets_allowed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "fsbo_listings" ADD COLUMN IF NOT EXISTS "allowed_pet_types" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "fsbo_listings" ADD COLUMN IF NOT EXISTS "max_pet_weight_kg" DOUBLE PRECISION;
ALTER TABLE "fsbo_listings" ADD COLUMN IF NOT EXISTS "pet_rules" TEXT;
ALTER TABLE "fsbo_listings" ADD COLUMN IF NOT EXISTS "experience_tags" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "fsbo_listings" ADD COLUMN IF NOT EXISTS "services_offered" JSONB NOT NULL DEFAULT '[]';
