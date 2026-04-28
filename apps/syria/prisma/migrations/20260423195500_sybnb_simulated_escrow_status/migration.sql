-- Simulated escrow UX column on SYBNB 2.0 bookings (no PSP funds).
ALTER TABLE "sybnb_bookings" ADD COLUMN "sybnb_simulated_escrow_status" TEXT;

-- Host-approved rows that already existed before this column.
UPDATE "sybnb_bookings"
SET "sybnb_simulated_escrow_status" = 'simulated_pending'
WHERE "sybnb_simulated_escrow_status" IS NULL
  AND "status"::text = 'approved';
