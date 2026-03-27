-- AlterTable + index (skip if FSBO module not deployed)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'fsbo_listings'
  ) THEN
    ALTER TABLE "fsbo_listings" ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION;
    ALTER TABLE "fsbo_listings" ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION;
    CREATE INDEX IF NOT EXISTS "fsbo_listings_city_status_moderation_status_idx" ON "fsbo_listings"("city", "status", "moderation_status");
  END IF;
END $$;
