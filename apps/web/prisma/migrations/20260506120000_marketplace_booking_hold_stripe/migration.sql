-- Order 57 — marketplace `bookings` holds; drop gist exclusion to allow re-book after `expired` holds.
DO $$
BEGIN
  IF to_regclass('public.bookings') IS NULL THEN
    RETURN;
  END IF;
  BEGIN
    ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS "no_overlap_booking";
  EXCEPTION
    WHEN undefined_object THEN NULL;
  END;
  DROP INDEX IF EXISTS "booking_range_idx";
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE public.bookings ADD COLUMN "expires_at" TIMESTAMP(3);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'bookings_status_expires_at_idx' AND n.nspname = 'public'
  ) THEN
    CREATE INDEX "bookings_status_expires_at_idx" ON public.bookings("status", "expires_at");
  END IF;
  UPDATE public.bookings SET
    "status" = 'confirmed',
    "expires_at" = NULL
  WHERE
    "status" IS NULL
    OR "status" = ''
    OR UPPER("status") = 'PENDING'
    OR "status" = 'PENDING';
END $$;
