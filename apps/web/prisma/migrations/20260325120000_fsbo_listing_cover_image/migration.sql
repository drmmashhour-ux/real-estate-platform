-- AlterTable (skip if FSBO module not deployed)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'fsbo_listings'
  ) THEN
    ALTER TABLE "fsbo_listings" ADD COLUMN IF NOT EXISTS "cover_image" TEXT;
  END IF;
END $$;
