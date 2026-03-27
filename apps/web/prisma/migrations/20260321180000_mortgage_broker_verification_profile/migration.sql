-- Mortgage broker profile + verification (AMF-style compliance fields)

ALTER TABLE "mortgage_brokers" ALTER COLUMN "phone" DROP NOT NULL;

ALTER TABLE "mortgage_brokers" ADD COLUMN IF NOT EXISTS "full_name" TEXT;
ALTER TABLE "mortgage_brokers" ADD COLUMN IF NOT EXISTS "license_number" TEXT NOT NULL DEFAULT '';
ALTER TABLE "mortgage_brokers" ADD COLUMN IF NOT EXISTS "years_experience" INTEGER;
ALTER TABLE "mortgage_brokers" ADD COLUMN IF NOT EXISTS "specialties" TEXT;
ALTER TABLE "mortgage_brokers" ADD COLUMN IF NOT EXISTS "profile_photo_url" TEXT;
ALTER TABLE "mortgage_brokers" ADD COLUMN IF NOT EXISTS "insurance_provider" TEXT;
ALTER TABLE "mortgage_brokers" ADD COLUMN IF NOT EXISTS "insurance_valid" BOOLEAN;
ALTER TABLE "mortgage_brokers" ADD COLUMN IF NOT EXISTS "broker_references" TEXT;
ALTER TABLE "mortgage_brokers" ADD COLUMN IF NOT EXISTS "is_verified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "mortgage_brokers" ADD COLUMN IF NOT EXISTS "verification_status" TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE "mortgage_brokers" ADD COLUMN IF NOT EXISTS "profile_completed_at" TIMESTAMP(3);

-- Existing rows: treat as already approved (pre-feature brokers + pool)
UPDATE "mortgage_brokers" SET "is_verified" = true, "verification_status" = 'approved';

-- Linked accounts that already existed: mark profile complete so they are not forced through the new wizard
UPDATE "mortgage_brokers" SET "profile_completed_at" = NOW() WHERE "user_id" IS NOT NULL;
