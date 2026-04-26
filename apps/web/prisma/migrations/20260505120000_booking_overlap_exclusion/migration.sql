-- Order A/C — marketplace `bookings` (packages/db-marketplace `@@map("bookings")`): no overlapping stays per listing.
-- Safe no-op if the table does not exist in this environment.
CREATE EXTENSION IF NOT EXISTS btree_gist;

DO $$
BEGIN
  IF to_regclass('public.bookings') IS NULL THEN
    RETURN;
  END IF;
  -- DB-level non-overlap (timestamp ranges; Prisma `DateTime` = timestamp(3))
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'no_overlap_booking') THEN
    ALTER TABLE public.bookings
    ADD CONSTRAINT no_overlap_booking
    EXCLUDE USING gist (
      listing_id WITH =,
      tsrange(start_date, end_date, '[]') WITH &&
    );
  END IF;
END $$;

-- Order C — optional GiST to accelerate overlap / availability scans
DO $$
BEGIN
  IF to_regclass('public.bookings') IS NULL THEN
    RETURN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'booking_range_idx') THEN
    CREATE INDEX booking_range_idx
    ON public.bookings
    USING gist (
      listing_id,
      tsrange(start_date, end_date, '[]')
    );
  END IF;
END $$;
