-- FsboListing: publish plan & payment audit (skip if FSBO module not deployed)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'fsbo_listings'
  ) THEN
    ALTER TABLE "fsbo_listings" ADD COLUMN IF NOT EXISTS "publish_plan" TEXT NOT NULL DEFAULT 'basic';
    ALTER TABLE "fsbo_listings" ADD COLUMN IF NOT EXISTS "publish_price_cents" INTEGER;
    ALTER TABLE "fsbo_listings" ADD COLUMN IF NOT EXISTS "paid_publish_at" TIMESTAMP(3);
    ALTER TABLE "fsbo_listings" ADD COLUMN IF NOT EXISTS "featured_until" TIMESTAMP(3);
  END IF;
END $$;

-- PlatformPayment: revenue split + FSBO listing link
ALTER TABLE "platform_payments" ADD COLUMN IF NOT EXISTS "platform_fee_cents" INTEGER;
ALTER TABLE "platform_payments" ADD COLUMN IF NOT EXISTS "host_payout_cents" INTEGER;
ALTER TABLE "platform_payments" ADD COLUMN IF NOT EXISTS "fsbo_listing_id" TEXT;

CREATE INDEX IF NOT EXISTS "platform_payments_fsbo_listing_id_idx" ON "platform_payments"("fsbo_listing_id");

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'fsbo_listings'
  ) THEN
    ALTER TABLE "platform_payments" DROP CONSTRAINT IF EXISTS "platform_payments_fsbo_listing_id_fkey";
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'platform_payments_fsbo_listing_id_fkey') THEN
      ALTER TABLE "platform_payments" ADD CONSTRAINT "platform_payments_fsbo_listing_id_fkey"
        FOREIGN KEY ("fsbo_listing_id") REFERENCES "fsbo_listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
  END IF;
END $$;
