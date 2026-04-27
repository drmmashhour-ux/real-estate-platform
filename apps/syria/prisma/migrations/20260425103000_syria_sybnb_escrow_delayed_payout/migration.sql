-- Additive SYBNB escrow / delayed payout (internal ledger; no external PSP fields).
ALTER TABLE "syria_payouts" ADD COLUMN "escrow_status" TEXT NOT NULL DEFAULT 'HELD';
ALTER TABLE "syria_payouts" ADD COLUMN "release_eligible_at" TIMESTAMP(3);
ALTER TABLE "syria_payouts" ADD COLUMN "escrow_released_at" TIMESTAMP(3);
ALTER TABLE "syria_payouts" ADD COLUMN "blocked_at" TIMESTAMP(3);
ALTER TABLE "syria_payouts" ADD COLUMN "blocked_reason" TEXT;
ALTER TABLE "syria_payouts" ADD COLUMN "release_approved_by_id" TEXT;
ALTER TABLE "syria_payouts" ADD COLUMN "release_approved_at" TIMESTAMP(3);
ALTER TABLE "syria_payouts" ADD COLUMN "payout_risk_status" TEXT NOT NULL DEFAULT 'PENDING_REVIEW';

CREATE INDEX "syria_payouts_escrow_status_idx" ON "syria_payouts"("escrow_status");

UPDATE "syria_payouts" AS p
SET "release_eligible_at" = b."check_out" + INTERVAL '24 hours'
FROM "syria_bookings" AS b
WHERE p."booking_id" = b."id"
  AND p."release_eligible_at" IS NULL;
