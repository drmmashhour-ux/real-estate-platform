-- Order 65 — optional price snapshot columns on marketplace `bookings` (listings DB).
-- Populated at `POST /api/checkout` when dates + listing match (server-validated `amount`).

ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "subtotal_cents" INTEGER;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "fee_cents" INTEGER;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "final_cents" INTEGER;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "nights" INTEGER;
