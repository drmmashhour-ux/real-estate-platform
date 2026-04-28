-- ORDER SYBNB-65 — Tie-break column + backfill from photo array length.

ALTER TABLE "syria_properties" ADD COLUMN "listing_photo_count" INTEGER NOT NULL DEFAULT 0;

UPDATE "syria_properties"
SET "listing_photo_count" = COALESCE(cardinality("images"), 0);
