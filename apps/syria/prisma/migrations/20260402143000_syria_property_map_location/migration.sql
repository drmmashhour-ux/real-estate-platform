-- Approximate map pin + city/area/landmark text for Syria listings.
ALTER TABLE "syria_properties" ADD COLUMN IF NOT EXISTS "area" TEXT;
ALTER TABLE "syria_properties" ADD COLUMN IF NOT EXISTS "address_text" TEXT;
ALTER TABLE "syria_properties" ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION;
ALTER TABLE "syria_properties" ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION;
