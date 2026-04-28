-- SYBNB-35 — agent commission ledger (amount from platform fee share; same currency as booking fee).
DO $$ BEGIN
  CREATE TYPE "SybnbAgentEarningStatus" AS ENUM ('pending', 'approved', 'paid');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE "sybnb_agent_earnings" (
    "id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'SYP',
    "status" "SybnbAgentEarningStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sybnb_agent_earnings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "sybnb_agent_earnings_booking_id_key" ON "sybnb_agent_earnings"("booking_id");

CREATE INDEX "sybnb_agent_earnings_agent_id_idx" ON "sybnb_agent_earnings"("agent_id");

CREATE INDEX "sybnb_agent_earnings_status_idx" ON "sybnb_agent_earnings"("status");

ALTER TABLE "sybnb_agent_earnings" ADD CONSTRAINT "sybnb_agent_earnings_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "syria_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "sybnb_agent_earnings" ADD CONSTRAINT "sybnb_agent_earnings_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "syria_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
