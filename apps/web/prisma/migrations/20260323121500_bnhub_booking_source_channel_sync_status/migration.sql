-- BNHub: booking origin channel + external mapping sync health

DO $$
BEGIN
  CREATE TYPE "BnhubBookingSource" AS ENUM ('LOCAL', 'AIRBNB', 'BOOKING_COM', 'EXPEDIA', 'OTHER');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "BnhubChannelSyncStatus" AS ENUM ('IDLE', 'OK', 'ERROR', 'SYNCING');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "booking_source" "BnhubBookingSource" NOT NULL DEFAULT 'LOCAL';
CREATE INDEX IF NOT EXISTS "Booking_booking_source_idx" ON "Booking"("booking_source");

ALTER TABLE "external_mapping" ADD COLUMN IF NOT EXISTS "sync_status" "BnhubChannelSyncStatus" NOT NULL DEFAULT 'IDLE';
ALTER TABLE "external_mapping" ADD COLUMN IF NOT EXISTS "last_error" TEXT;
CREATE INDEX IF NOT EXISTS "external_mapping_sync_status_idx" ON "external_mapping"("sync_status");
