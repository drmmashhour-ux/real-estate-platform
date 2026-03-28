-- BNHub + LECIPM internal CRM telemetry + optional Lead → ShortTermListing link

ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "short_term_listing_id" TEXT;

CREATE INDEX IF NOT EXISTS "Lead_short_term_listing_id_idx" ON "Lead"("short_term_listing_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Lead_short_term_listing_id_fkey'
  ) THEN
    ALTER TABLE "Lead"
      ADD CONSTRAINT "Lead_short_term_listing_id_fkey"
      FOREIGN KEY ("short_term_listing_id") REFERENCES "ShortTermListing"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "internal_crm_events" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "event_type" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'platform',
    "user_id" TEXT,
    "session_id" TEXT,
    "lead_id" TEXT,
    "short_term_listing_id" TEXT,
    "fsbo_listing_id" TEXT,
    "booking_id" TEXT,
    "metadata" JSONB,

    CONSTRAINT "internal_crm_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "internal_crm_events_lead_id_created_at_idx" ON "internal_crm_events"("lead_id", "created_at");
CREATE INDEX IF NOT EXISTS "internal_crm_events_user_id_created_at_idx" ON "internal_crm_events"("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "internal_crm_events_short_term_listing_id_created_at_idx" ON "internal_crm_events"("short_term_listing_id", "created_at");
CREATE INDEX IF NOT EXISTS "internal_crm_events_event_type_created_at_idx" ON "internal_crm_events"("event_type", "created_at");
CREATE INDEX IF NOT EXISTS "internal_crm_events_channel_created_at_idx" ON "internal_crm_events"("channel", "created_at");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'internal_crm_events_user_id_fkey') THEN
    ALTER TABLE "internal_crm_events"
      ADD CONSTRAINT "internal_crm_events_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'internal_crm_events_lead_id_fkey') THEN
    ALTER TABLE "internal_crm_events"
      ADD CONSTRAINT "internal_crm_events_lead_id_fkey"
      FOREIGN KEY ("lead_id") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'internal_crm_events_short_term_listing_id_fkey') THEN
    ALTER TABLE "internal_crm_events"
      ADD CONSTRAINT "internal_crm_events_short_term_listing_id_fkey"
      FOREIGN KEY ("short_term_listing_id") REFERENCES "ShortTermListing"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'internal_crm_events_fsbo_listing_id_fkey') THEN
    ALTER TABLE "internal_crm_events"
      ADD CONSTRAINT "internal_crm_events_fsbo_listing_id_fkey"
      FOREIGN KEY ("fsbo_listing_id") REFERENCES "fsbo_listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'internal_crm_events_booking_id_fkey') THEN
    ALTER TABLE "internal_crm_events"
      ADD CONSTRAINT "internal_crm_events_booking_id_fkey"
      FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
