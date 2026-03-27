-- BNHub guarantee rows (trust layer; claimable on mismatch/issue)
CREATE TYPE "BnhubGuaranteeStatus" AS ENUM ('ACTIVE', 'CLAIMED', 'RESOLVED');

CREATE TABLE "bn_guarantees" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "guarantee_type" TEXT NOT NULL,
    "status" "BnhubGuaranteeStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bn_guarantees_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "bn_guarantees_booking_id_idx" ON "bn_guarantees"("booking_id");
CREATE INDEX "bn_guarantees_status_idx" ON "bn_guarantees"("status");

ALTER TABLE "bn_guarantees" ADD CONSTRAINT "bn_guarantees_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
