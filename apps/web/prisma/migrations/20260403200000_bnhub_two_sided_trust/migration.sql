-- BNHub two-sided trust snapshots + lightweight disputes + host checklist declaration

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bnhub_guest_trust_score" INTEGER NOT NULL DEFAULT 50;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bnhub_guest_total_stays" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bnhub_guest_rating_average" DOUBLE PRECISION;

ALTER TABLE "bnhub_listings" ADD COLUMN IF NOT EXISTS "bnhub_listing_rating_average" DOUBLE PRECISION;
ALTER TABLE "bnhub_listings" ADD COLUMN IF NOT EXISTS "bnhub_listing_review_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "bnhub_listings" ADD COLUMN IF NOT EXISTS "bnhub_listing_completed_stays" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "bnhub_listings" ADD COLUMN IF NOT EXISTS "bnhub_listing_host_verified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "bnhub_listings" ADD COLUMN IF NOT EXISTS "bnhub_listing_top_host_badge" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "checklist_declared_by_host_at" TIMESTAMP(3);

DO $$ BEGIN
  CREATE TYPE "BnhubTrustSimpleDisputeStatus" AS ENUM ('OPEN', 'RESOLVED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE "bnhub_trust_simple_disputes" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "reporter_id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "BnhubTrustSimpleDisputeStatus" NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "bnhub_trust_simple_disputes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "bnhub_trust_simple_disputes_booking_id_idx" ON "bnhub_trust_simple_disputes"("booking_id");
CREATE INDEX "bnhub_trust_simple_disputes_status_idx" ON "bnhub_trust_simple_disputes"("status");

ALTER TABLE "bnhub_trust_simple_disputes" ADD CONSTRAINT "bnhub_trust_simple_disputes_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bnhub_trust_simple_disputes" ADD CONSTRAINT "bnhub_trust_simple_disputes_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
