-- Payment / platform payment / BNHub invoice ↔ enforceable contract references + payout schedule + commission & dispute ledgers

ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "scheduled_host_payout_at" TIMESTAMP(3);
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "linked_contract_id" TEXT;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "linked_contract_type" TEXT;

CREATE INDEX IF NOT EXISTS "payments_linked_contract_id_idx" ON "payments"("linked_contract_id");

ALTER TABLE "payments"
  ADD CONSTRAINT "payments_linked_contract_id_fkey"
  FOREIGN KEY ("linked_contract_id") REFERENCES "contracts"("id") ON DELETE SET ON UPDATE CASCADE;

ALTER TABLE "platform_payments" ADD COLUMN IF NOT EXISTS "linked_contract_id" TEXT;
ALTER TABLE "platform_payments" ADD COLUMN IF NOT EXISTS "linked_contract_type" TEXT;

CREATE INDEX IF NOT EXISTS "platform_payments_linked_contract_id_idx" ON "platform_payments"("linked_contract_id");

ALTER TABLE "platform_payments"
  ADD CONSTRAINT "platform_payments_linked_contract_id_fkey"
  FOREIGN KEY ("linked_contract_id") REFERENCES "contracts"("id") ON DELETE SET ON UPDATE CASCADE;

ALTER TABLE "bnhub_booking_invoices" ADD COLUMN IF NOT EXISTS "linked_contract_id" TEXT;
ALTER TABLE "bnhub_booking_invoices" ADD COLUMN IF NOT EXISTS "linked_contract_type" TEXT;

CREATE INDEX IF NOT EXISTS "bnhub_booking_invoices_linked_contract_id_idx" ON "bnhub_booking_invoices"("linked_contract_id");

ALTER TABLE "bnhub_booking_invoices"
  ADD CONSTRAINT "bnhub_booking_invoices_linked_contract_id_fkey"
  FOREIGN KEY ("linked_contract_id") REFERENCES "contracts"("id") ON DELETE SET ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "platform_commission_records" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT,
    "deal_id" TEXT,
    "booking_id" TEXT,
    "contract_id" TEXT,
    "commission_eligible" BOOLEAN NOT NULL DEFAULT false,
    "commission_source" TEXT,
    "commission_amount_cents" INTEGER,
    "platform_share_cents" INTEGER,
    "partner_share_cents" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'cad',
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_commission_records_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "platform_commission_records_lead_id_idx" ON "platform_commission_records"("lead_id");
CREATE INDEX IF NOT EXISTS "platform_commission_records_deal_id_idx" ON "platform_commission_records"("deal_id");
CREATE INDEX IF NOT EXISTS "platform_commission_records_booking_id_idx" ON "platform_commission_records"("booking_id");
CREATE INDEX IF NOT EXISTS "platform_commission_records_contract_id_idx" ON "platform_commission_records"("contract_id");
CREATE INDEX IF NOT EXISTS "platform_commission_records_commission_source_idx" ON "platform_commission_records"("commission_source");

ALTER TABLE "platform_commission_records"
  ADD CONSTRAINT "platform_commission_records_lead_id_fkey"
  FOREIGN KEY ("lead_id") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "platform_commission_records"
  ADD CONSTRAINT "platform_commission_records_deal_id_fkey"
  FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "platform_commission_records"
  ADD CONSTRAINT "platform_commission_records_booking_id_fkey"
  FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "platform_commission_records"
  ADD CONSTRAINT "platform_commission_records_contract_id_fkey"
  FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "platform_legal_disputes" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "booking_id" TEXT,
    "listing_id" TEXT,
    "fsbo_listing_id" TEXT,
    "deal_id" TEXT,
    "lead_id" TEXT,
    "platform_invoice_id" TEXT,
    "platform_payment_id" TEXT,
    "opened_by_user_id" TEXT NOT NULL,
    "target_user_id" TEXT,
    "description" TEXT NOT NULL,
    "evidence_urls" JSONB,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "resolution_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_legal_disputes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "platform_legal_disputes_type_idx" ON "platform_legal_disputes"("type");
CREATE INDEX IF NOT EXISTS "platform_legal_disputes_status_idx" ON "platform_legal_disputes"("status");
CREATE INDEX IF NOT EXISTS "platform_legal_disputes_opened_by_user_id_idx" ON "platform_legal_disputes"("opened_by_user_id");
CREATE INDEX IF NOT EXISTS "platform_legal_disputes_booking_id_idx" ON "platform_legal_disputes"("booking_id");
CREATE INDEX IF NOT EXISTS "platform_legal_disputes_deal_id_idx" ON "platform_legal_disputes"("deal_id");
CREATE INDEX IF NOT EXISTS "platform_legal_disputes_lead_id_idx" ON "platform_legal_disputes"("lead_id");

ALTER TABLE "platform_legal_disputes"
  ADD CONSTRAINT "platform_legal_disputes_booking_id_fkey"
  FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "platform_legal_disputes"
  ADD CONSTRAINT "platform_legal_disputes_deal_id_fkey"
  FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "platform_legal_disputes"
  ADD CONSTRAINT "platform_legal_disputes_lead_id_fkey"
  FOREIGN KEY ("lead_id") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "platform_legal_disputes"
  ADD CONSTRAINT "platform_legal_disputes_opened_by_user_id_fkey"
  FOREIGN KEY ("opened_by_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "platform_legal_disputes"
  ADD CONSTRAINT "platform_legal_disputes_target_user_id_fkey"
  FOREIGN KEY ("target_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
