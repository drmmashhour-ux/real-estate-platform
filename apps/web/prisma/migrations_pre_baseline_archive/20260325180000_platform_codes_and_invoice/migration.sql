-- Atomic code sequences + public entity codes + platform invoice hardening

DO $$ BEGIN
  CREATE TYPE "PlatformInvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'PAID', 'VOID', 'OVERDUE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "platform_code_sequences" (
  "id" TEXT NOT NULL,
  "scope" TEXT NOT NULL,
  "next_value" INTEGER NOT NULL DEFAULT 1,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "platform_code_sequences_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "platform_code_sequences_scope_key" UNIQUE ("scope")
);

ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "booking_code" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Booking_booking_code_key" ON "Booking"("booking_code");

ALTER TABLE "deals" ADD COLUMN IF NOT EXISTS "deal_code" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "deals_deal_code_key" ON "deals"("deal_code");

ALTER TABLE "platform_legal_disputes" ADD COLUMN IF NOT EXISTS "dispute_code" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "platform_legal_disputes_dispute_code_key" ON "platform_legal_disputes"("dispute_code");

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'platform_invoices' AND column_name = 'number'
  ) THEN
    ALTER TABLE "platform_invoices" RENAME COLUMN "number" TO "invoice_number";
  END IF;
END $$;

ALTER TABLE "platform_invoices" ADD COLUMN IF NOT EXISTS "status" "PlatformInvoiceStatus";
UPDATE "platform_invoices" SET "status" = 'ISSUED' WHERE "status" IS NULL;
ALTER TABLE "platform_invoices" ALTER COLUMN "status" SET NOT NULL;
ALTER TABLE "platform_invoices" ALTER COLUMN "status" SET DEFAULT 'ISSUED';

ALTER TABLE "platform_invoices" ADD COLUMN IF NOT EXISTS "hub_source" TEXT;
ALTER TABLE "platform_invoices" ADD COLUMN IF NOT EXISTS "issued_at" TIMESTAMP(3);
UPDATE "platform_invoices" SET "issued_at" = "created_at" WHERE "issued_at" IS NULL;
ALTER TABLE "platform_invoices" ALTER COLUMN "issued_at" SET NOT NULL;
ALTER TABLE "platform_invoices" ALTER COLUMN "issued_at" SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "platform_invoices" ADD COLUMN IF NOT EXISTS "due_at" TIMESTAMP(3);
ALTER TABLE "platform_invoices" ADD COLUMN IF NOT EXISTS "paid_at" TIMESTAMP(3);
ALTER TABLE "platform_invoices" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "platform_invoices" ADD COLUMN IF NOT EXISTS "linked_contract_id" TEXT;

CREATE INDEX IF NOT EXISTS "platform_invoices_status_idx" ON "platform_invoices"("status");

UPDATE "platform_invoices" pi
SET
  "status" = 'PAID',
  "paid_at" = COALESCE(pi."paid_at", pi."issued_at")
FROM "platform_payments" pp
WHERE pi."payment_id" = pp."id" AND pp."status" = 'paid' AND pi."status" <> 'VOID';

DO $$ BEGIN
  ALTER TABLE "platform_invoices" ADD CONSTRAINT "platform_invoices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "platform_payments" ADD CONSTRAINT "platform_payments_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
