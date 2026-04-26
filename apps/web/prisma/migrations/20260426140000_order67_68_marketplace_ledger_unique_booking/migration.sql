-- Order 67 — `marketplace_payment_ledger` finance log (one row per Checkout session).
-- Order 68 — unique (user_id, listing_id, start_date, end_date) on `bookings` for duplicate protection.
-- Safe no-ops if objects already exist.

CREATE TABLE IF NOT EXISTS "public"."marketplace_payment_ledger" (
  "id" TEXT NOT NULL,
  "listing_id" TEXT,
  "booking_id" TEXT,
  "amount_cents" INTEGER NOT NULL,
  "application_fee_cents" INTEGER NOT NULL DEFAULT 0,
  "stripe_payment_intent_id" TEXT,
  "stripe_checkout_session_id" TEXT NOT NULL,
  "destination_account_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "marketplace_payment_ledger_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "marketplace_payment_ledger_stripe_checkout_session_id_key"
  ON "public"."marketplace_payment_ledger"("stripe_checkout_session_id");

CREATE INDEX IF NOT EXISTS "marketplace_payment_ledger_booking_id_idx"
  ON "public"."marketplace_payment_ledger"("booking_id");

CREATE INDEX IF NOT EXISTS "marketplace_payment_ledger_listing_id_idx"
  ON "public"."marketplace_payment_ledger"("listing_id");

DO $$
BEGIN
  IF to_regclass('public.bookings') IS NULL THEN
    RETURN;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bookings_user_listing_stay_unique'
  ) THEN
    ALTER TABLE public.bookings
    ADD CONSTRAINT bookings_user_listing_stay_unique
    UNIQUE (user_id, listing_id, start_date, end_date);
  END IF;
END $$;
