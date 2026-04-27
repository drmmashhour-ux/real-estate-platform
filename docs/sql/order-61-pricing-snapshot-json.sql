-- Order 61 — `pricing_snapshot` JSON on `bookings` (listings DB). Optional audit trail of nightly lines.

ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "pricing_snapshot" JSONB;
