-- BNHub listing lifestyle, pets, experience, services + booking structured special requests

ALTER TABLE "bnhub_listings" ADD COLUMN "noise_level" TEXT;
ALTER TABLE "bnhub_listings" ADD COLUMN "family_friendly" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "bnhub_listings" ADD COLUMN "kids_allowed" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "bnhub_listings" ADD COLUMN "party_allowed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "bnhub_listings" ADD COLUMN "smoking_allowed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "bnhub_listings" ADD COLUMN "pets_allowed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "bnhub_listings" ADD COLUMN "allowed_pet_types" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "bnhub_listings" ADD COLUMN "max_pet_weight_kg" DOUBLE PRECISION;
ALTER TABLE "bnhub_listings" ADD COLUMN "pet_rules" TEXT;
ALTER TABLE "bnhub_listings" ADD COLUMN "experience_tags" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "bnhub_listings" ADD COLUMN "services_offered" JSONB NOT NULL DEFAULT '[]';

ALTER TABLE "Booking" ADD COLUMN "special_requests_json" JSONB;
