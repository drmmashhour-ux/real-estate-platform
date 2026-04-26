-- Order 59 — marketplace `bookings`: cancellation + Stripe refund key
DO $$
BEGIN
  IF to_regclass('public.bookings') IS NULL THEN
    RETURN;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'cancelled_at'
  ) THEN
    ALTER TABLE public.bookings ADD COLUMN "cancelled_at" TIMESTAMP(3);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'stripe_payment_intent_id'
  ) THEN
    ALTER TABLE public.bookings ADD COLUMN "stripe_payment_intent_id" TEXT;
  END IF;
END $$;
