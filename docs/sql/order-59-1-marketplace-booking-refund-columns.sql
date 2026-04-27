-- Order 59.1 — marketplace `bookings` (listings DB). Run against the same database as @repo/db-listings.
-- Safe to re-run: IF NOT EXISTS (PostgreSQL 9.1+ style via DO block if needed on older).

ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "refund_status" TEXT NOT NULL DEFAULT 'none';
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "refunded_amount_cents" INTEGER NOT NULL DEFAULT 0;

-- Optional: tighten (application uses none|pending|completed|failed)
-- CHECK (refund_status IN ('none', 'pending', 'completed', 'failed'));
