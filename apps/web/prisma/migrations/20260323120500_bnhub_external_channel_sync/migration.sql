-- BNHub: external OTA mapping, per-night availability status, sync logs, host external_sync toggle

-- Enums (idempotent)
DO $$
BEGIN
  CREATE TYPE "BnhubChannelPlatform" AS ENUM ('BOOKING_COM', 'AIRBNB', 'EXPEDIA');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "BnhubDayAvailabilityStatus" AS ENUM ('AVAILABLE', 'BLOCKED', 'BOOKED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- AvailabilitySlot: day-level status + booking link for double-booking prevention
ALTER TABLE "AvailabilitySlot" ADD COLUMN IF NOT EXISTS "day_status" "BnhubDayAvailabilityStatus" NOT NULL DEFAULT 'AVAILABLE';
ALTER TABLE "AvailabilitySlot" ADD COLUMN IF NOT EXISTS "booked_by_booking_id" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'AvailabilitySlot_booked_by_booking_id_fkey'
  ) THEN
    ALTER TABLE "AvailabilitySlot"
      ADD CONSTRAINT "AvailabilitySlot_booked_by_booking_id_fkey"
      FOREIGN KEY ("booked_by_booking_id") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "AvailabilitySlot_booked_by_booking_id_idx" ON "AvailabilitySlot"("booked_by_booking_id");

-- Listings: channel manager toggle
ALTER TABLE "bnhub_listings" ADD COLUMN IF NOT EXISTS "external_sync_enabled" BOOLEAN NOT NULL DEFAULT false;

-- external_mapping (BnhubExternalListingMapping)
CREATE TABLE IF NOT EXISTS "external_mapping" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "platform" "BnhubChannelPlatform" NOT NULL,
    "external_id" TEXT NOT NULL,
    "last_sync_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "external_mapping_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "external_mapping_listing_id_platform_key" ON "external_mapping"("listing_id", "platform");
CREATE INDEX IF NOT EXISTS "external_mapping_external_id_idx" ON "external_mapping"("external_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'external_mapping_listing_id_fkey'
  ) THEN
    ALTER TABLE "external_mapping"
      ADD CONSTRAINT "external_mapping_listing_id_fkey"
      FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- bnhub_channel_sync_logs
CREATE TABLE IF NOT EXISTS "bnhub_channel_sync_logs" (
    "id" TEXT NOT NULL,
    "mapping_id" TEXT,
    "listing_id" TEXT,
    "platform" TEXT,
    "direction" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bnhub_channel_sync_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "bnhub_channel_sync_logs_listing_id_idx" ON "bnhub_channel_sync_logs"("listing_id");
CREATE INDEX IF NOT EXISTS "bnhub_channel_sync_logs_created_at_idx" ON "bnhub_channel_sync_logs"("created_at");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bnhub_channel_sync_logs_mapping_id_fkey'
  ) THEN
    ALTER TABLE "bnhub_channel_sync_logs"
      ADD CONSTRAINT "bnhub_channel_sync_logs_mapping_id_fkey"
      FOREIGN KEY ("mapping_id") REFERENCES "external_mapping"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
