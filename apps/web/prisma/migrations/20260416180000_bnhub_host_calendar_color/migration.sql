-- BNHub host calendar: per-listing color for FullCalendar
ALTER TABLE "bnhub_listings" ADD COLUMN IF NOT EXISTS "calendar_color" VARCHAR(16) DEFAULT '#D4AF37';
