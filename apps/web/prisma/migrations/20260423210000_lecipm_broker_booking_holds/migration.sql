-- LECIPM: per-broker visit caps, visit request source + soft holds (AI Closer / mobile booking)

CREATE TABLE IF NOT EXISTS "lecipm_broker_booking_settings" (
    "id" TEXT NOT NULL,
    "broker_user_id" TEXT NOT NULL,
    "max_visits_per_day" INTEGER NOT NULL DEFAULT 4,
    "time_zone" TEXT NOT NULL DEFAULT 'America/Toronto',
    "performance_score" DOUBLE PRECISION DEFAULT 0.7,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lecipm_broker_booking_settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "lecipm_broker_booking_settings_broker_user_id_key" ON "lecipm_broker_booking_settings"("broker_user_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'lecipm_broker_booking_settings_broker_user_id_fkey'
  ) THEN
    ALTER TABLE "lecipm_broker_booking_settings"
    ADD CONSTRAINT "lecipm_broker_booking_settings_broker_user_id_fkey"
    FOREIGN KEY ("broker_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE "lecipm_visit_requests" ADD COLUMN IF NOT EXISTS "visit_source" VARCHAR(32);
ALTER TABLE "lecipm_visit_requests" ADD COLUMN IF NOT EXISTS "hold_expires_at" TIMESTAMP(3);
ALTER TABLE "lecipm_visit_requests" ADD COLUMN IF NOT EXISTS "metadata" JSONB;

CREATE INDEX IF NOT EXISTS "lecipm_visit_requests_hold_expires_at_idx" ON "lecipm_visit_requests"("hold_expires_at");
