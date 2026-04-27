-- SYBNB risk flag on SyriaBooking (payment gating)
DO $$ BEGIN
  CREATE TYPE "SybnbRiskState" AS ENUM ('clear', 'review', 'blocked');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "syria_bookings" ADD COLUMN "risk_status" "SybnbRiskState" NOT NULL DEFAULT 'clear';
