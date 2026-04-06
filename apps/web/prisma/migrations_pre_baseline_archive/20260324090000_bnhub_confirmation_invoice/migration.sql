-- BNHub: booking confirmation code, payment checkout session id, invoice snapshot table
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "confirmation_code" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Booking_confirmation_code_key" ON "Booking"("confirmation_code");

ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "stripe_checkout_session_id" TEXT;

CREATE TABLE IF NOT EXISTS "bnhub_booking_invoices" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "stripe_session_id" TEXT,
    "payment_intent_id" TEXT,
    "guest_name_snapshot" TEXT,
    "listing_title_snapshot" TEXT,
    "confirmation_code" TEXT,
    "total_amount_cents" INTEGER NOT NULL,
    "platform_fee_cents" INTEGER,
    "host_payout_cents" INTEGER,
    "payment_status" TEXT NOT NULL,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bnhub_booking_invoices_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "bnhub_booking_invoices_booking_id_key" ON "bnhub_booking_invoices"("booking_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bnhub_booking_invoices_booking_id_fkey'
  ) THEN
    ALTER TABLE "bnhub_booking_invoices"
      ADD CONSTRAINT "bnhub_booking_invoices_booking_id_fkey"
      FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "bnhub_booking_invoices_booking_id_idx" ON "bnhub_booking_invoices"("booking_id");
CREATE INDEX IF NOT EXISTS "bnhub_booking_invoices_confirmation_code_idx" ON "bnhub_booking_invoices"("confirmation_code");

ALTER TABLE "bnhub_booking_invoices" ADD COLUMN IF NOT EXISTS "stripe_connect_account_id" TEXT;
