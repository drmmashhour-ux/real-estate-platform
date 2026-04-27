-- SYBNB lifecycle: APPROVED (awaiting payment), COMPLETED (post-stay), checkout session id.
DO $$ BEGIN ALTER TYPE "SyriaBookingStatus" ADD VALUE 'APPROVED'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "SyriaBookingStatus" ADD VALUE 'COMPLETED'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "syria_bookings" ADD COLUMN IF NOT EXISTS "sybnb_checkout_session_id" TEXT;
