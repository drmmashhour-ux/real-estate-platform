-- Listing plan tier (free / featured / premium) + premium payment purpose.

DO $$ BEGIN CREATE TYPE "SyriaListingPlan" AS ENUM ('free', 'featured', 'premium'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TYPE "SyriaListingPaymentPurpose" ADD VALUE 'PREMIUM'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "syria_properties" ADD COLUMN IF NOT EXISTS "plan" "SyriaListingPlan" NOT NULL DEFAULT 'free';

UPDATE "syria_properties" SET "plan" = 'featured' WHERE "is_featured" = true AND "plan" = 'free';
