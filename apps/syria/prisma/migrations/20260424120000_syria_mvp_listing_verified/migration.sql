-- MVP: optional manual "Verified" badge on listing cards.

ALTER TABLE "syria_properties" ADD COLUMN IF NOT EXISTS "listing_verified" BOOLEAN NOT NULL DEFAULT false;
