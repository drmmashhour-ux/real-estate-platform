-- BNHub: transactional email timestamps, Connect destination on payment + invoice snapshot

ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "guest_confirmation_email_sent_at" TIMESTAMP(3);
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "guest_invoice_email_sent_at" TIMESTAMP(3);
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "host_booking_alert_email_sent_at" TIMESTAMP(3);

ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "stripe_connect_account_id" TEXT;

-- Table is created in 20260324090000_bnhub_confirmation_invoice; avoid failing when it does not exist yet.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'bnhub_booking_invoices'
  ) THEN
    ALTER TABLE "bnhub_booking_invoices" ADD COLUMN IF NOT EXISTS "stripe_connect_account_id" TEXT;
  END IF;
END $$;
