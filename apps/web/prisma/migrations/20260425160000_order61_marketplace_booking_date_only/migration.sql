-- Order 61 — marketplace `bookings` / `listing_bookings`: `start_date` / `end_date` as PostgreSQL `DATE` (no time) for timezone-safe calendar logic.
-- Safe no-ops if tables are missing. Drops GiST index built on `tsrange(timestamp)` before altering; overlap constraint was removed in Order 57.
DO $$
BEGIN
  IF to_regclass('public.bookings') IS NULL THEN
    RETURN;
  END IF;
  DROP INDEX IF EXISTS "booking_range_idx";
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'start_date'
      AND udt_name = 'timestamptz'
  ) OR EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'start_date'
      AND udt_name = 'timestamp'
  ) THEN
    ALTER TABLE public.bookings
      ALTER COLUMN "start_date" TYPE date USING (("start_date")::date);
    ALTER TABLE public.bookings
      ALTER COLUMN "end_date" TYPE date USING (("end_date")::date);
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.listing_bookings') IS NULL THEN
    RETURN;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'listing_bookings' AND column_name = 'start_date'
      AND udt_name IN ('timestamptz', 'timestamp')
  ) THEN
    ALTER TABLE public.listing_bookings
      ALTER COLUMN "start_date" TYPE date USING (("start_date")::date);
    ALTER TABLE public.listing_bookings
      ALTER COLUMN "end_date" TYPE date USING (("end_date")::date);
  END IF;
END $$;
