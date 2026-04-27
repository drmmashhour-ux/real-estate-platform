-- SYBNB trust gates: host verification fields + stay listing review enum.

DO $$ BEGIN
  CREATE TYPE "SyriaSybnbListingReview" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "syria_properties" ADD COLUMN IF NOT EXISTS "sybnb_review" "SyriaSybnbListingReview" NOT NULL DEFAULT 'PENDING';

UPDATE "syria_properties" SET "sybnb_review" = 'APPROVED' WHERE "marketplace_category" = 'stay';

ALTER TABLE "syria_users" ADD COLUMN IF NOT EXISTS "verified_at" TIMESTAMP(3);
ALTER TABLE "syria_users" ADD COLUMN IF NOT EXISTS "verification_level" TEXT;
ALTER TABLE "syria_users" ADD COLUMN IF NOT EXISTS "sybnb_supply_paused" BOOLEAN NOT NULL DEFAULT false;
