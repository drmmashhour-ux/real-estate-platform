-- Phase 5: receipt-of-cash expansion + financial ledger, registers, compliance events

ALTER TABLE "cash_receipt_forms" ADD COLUMN IF NOT EXISTS "receipt_number" TEXT;
ALTER TABLE "cash_receipt_forms" ADD COLUMN IF NOT EXISTS "payer_user_id" TEXT;
ALTER TABLE "cash_receipt_forms" ADD COLUMN IF NOT EXISTS "payer_name" TEXT;
ALTER TABLE "cash_receipt_forms" ADD COLUMN IF NOT EXISTS "payer_contact" TEXT;
ALTER TABLE "cash_receipt_forms" ADD COLUMN IF NOT EXISTS "offer_id" TEXT;
ALTER TABLE "cash_receipt_forms" ADD COLUMN IF NOT EXISTS "contract_id" TEXT;
ALTER TABLE "cash_receipt_forms" ADD COLUMN IF NOT EXISTS "deal_id" TEXT;
ALTER TABLE "cash_receipt_forms" ADD COLUMN IF NOT EXISTS "booking_id" TEXT;
ALTER TABLE "cash_receipt_forms" ADD COLUMN IF NOT EXISTS "broker_id" TEXT;
ALTER TABLE "cash_receipt_forms" ADD COLUMN IF NOT EXISTS "agency_id" TEXT;
ALTER TABLE "cash_receipt_forms" ADD COLUMN IF NOT EXISTS "currency" TEXT;
ALTER TABLE "cash_receipt_forms" ADD COLUMN IF NOT EXISTS "payment_method" TEXT;
ALTER TABLE "cash_receipt_forms" ADD COLUMN IF NOT EXISTS "received_for_type" TEXT;
ALTER TABLE "cash_receipt_forms" ADD COLUMN IF NOT EXISTS "received_for_label" TEXT;
ALTER TABLE "cash_receipt_forms" ADD COLUMN IF NOT EXISTS "funds_destination_type" TEXT;
ALTER TABLE "cash_receipt_forms" ADD COLUMN IF NOT EXISTS "external_reference" TEXT;
ALTER TABLE "cash_receipt_forms" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "cash_receipt_forms" ADD COLUMN IF NOT EXISTS "received_at" TIMESTAMP(3);
ALTER TABLE "cash_receipt_forms" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3);

UPDATE "cash_receipt_forms" SET "receipt_number" = 'RCPT-LEGACY-' || "id" WHERE "receipt_number" IS NULL;
UPDATE "cash_receipt_forms" SET "amount_cents" = COALESCE("amount_cents", 0);
UPDATE "cash_receipt_forms" SET "currency" = COALESCE("currency", 'CAD');
UPDATE "cash_receipt_forms" SET "payment_method" = COALESCE("payment_method", 'other');
UPDATE "cash_receipt_forms" SET "received_for_type" = COALESCE("received_for_type", 'other');
UPDATE "cash_receipt_forms" SET "funds_destination_type" = COALESCE("funds_destination_type", 'pending_review');
UPDATE "cash_receipt_forms" SET "received_at" = "created_at" WHERE "received_at" IS NULL;
UPDATE "cash_receipt_forms" SET "updated_at" = CURRENT_TIMESTAMP WHERE "updated_at" IS NULL;

ALTER TABLE "cash_receipt_forms" ALTER COLUMN "receipt_number" SET NOT NULL;
ALTER TABLE "cash_receipt_forms" ALTER COLUMN "amount_cents" SET NOT NULL;
ALTER TABLE "cash_receipt_forms" ALTER COLUMN "currency" SET DEFAULT 'CAD';
ALTER TABLE "cash_receipt_forms" ALTER COLUMN "currency" SET NOT NULL;
ALTER TABLE "cash_receipt_forms" ALTER COLUMN "payment_method" SET NOT NULL;
ALTER TABLE "cash_receipt_forms" ALTER COLUMN "received_for_type" SET NOT NULL;
ALTER TABLE "cash_receipt_forms" ALTER COLUMN "funds_destination_type" SET NOT NULL;
ALTER TABLE "cash_receipt_forms" ALTER COLUMN "received_at" SET NOT NULL;
ALTER TABLE "cash_receipt_forms" ALTER COLUMN "updated_at" SET NOT NULL;
ALTER TABLE "cash_receipt_forms" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS "cash_receipt_forms_receipt_number_key" ON "cash_receipt_forms"("receipt_number");

CREATE TABLE "financial_ledger_entries" (
    "id" TEXT NOT NULL,
    "owner_type" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "entry_number" TEXT NOT NULL,
    "entry_type" TEXT NOT NULL,
    "account_bucket" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'CAD',
    "cash_receipt_form_id" TEXT,
    "trust_deposit_id" TEXT,
    "related_entry_id" TEXT,
    "listing_id" TEXT,
    "offer_id" TEXT,
    "contract_id" TEXT,
    "deal_id" TEXT,
    "effective_date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "created_by_id" TEXT,
    "approved_by_id" TEXT,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "financial_ledger_entries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "financial_ledger_entries_entry_number_key" ON "financial_ledger_entries"("entry_number");
CREATE INDEX "idx_fin_ledger_owner" ON "financial_ledger_entries"("owner_type", "owner_id");
CREATE INDEX "idx_fin_ledger_cash_receipt" ON "financial_ledger_entries"("cash_receipt_form_id");
CREATE INDEX "idx_fin_ledger_trust_deposit" ON "financial_ledger_entries"("trust_deposit_id");
CREATE INDEX "idx_fin_ledger_effective_date" ON "financial_ledger_entries"("effective_date");

ALTER TABLE "financial_ledger_entries" ADD CONSTRAINT "financial_ledger_entries_cash_receipt_form_id_fkey" FOREIGN KEY ("cash_receipt_form_id") REFERENCES "cash_receipt_forms"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "financial_ledger_entries" ADD CONSTRAINT "financial_ledger_entries_trust_deposit_id_fkey" FOREIGN KEY ("trust_deposit_id") REFERENCES "trust_deposits"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "financial_ledger_entries" ADD CONSTRAINT "financial_ledger_entries_related_entry_id_fkey" FOREIGN KEY ("related_entry_id") REFERENCES "financial_ledger_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "financial_registers" (
    "id" TEXT NOT NULL,
    "owner_type" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "register_type" TEXT NOT NULL,
    "register_date" TIMESTAMP(3) NOT NULL,
    "period_key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "financial_registers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uq_financial_register_period" ON "financial_registers"("owner_type", "owner_id", "register_type", "period_key");
CREATE INDEX "idx_financial_register_owner" ON "financial_registers"("owner_type", "owner_id");

CREATE TABLE "financial_register_links" (
    "id" TEXT NOT NULL,
    "financial_register_id" TEXT NOT NULL,
    "cash_receipt_form_id" TEXT,
    "ledger_entry_id" TEXT,
    "trust_deposit_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "financial_register_links_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_fin_reg_link_register" ON "financial_register_links"("financial_register_id");
CREATE INDEX "idx_fin_reg_link_receipt" ON "financial_register_links"("cash_receipt_form_id");
CREATE INDEX "idx_fin_reg_link_ledger" ON "financial_register_links"("ledger_entry_id");

ALTER TABLE "financial_register_links" ADD CONSTRAINT "financial_register_links_financial_register_id_fkey" FOREIGN KEY ("financial_register_id") REFERENCES "financial_registers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "financial_register_links" ADD CONSTRAINT "financial_register_links_cash_receipt_form_id_fkey" FOREIGN KEY ("cash_receipt_form_id") REFERENCES "cash_receipt_forms"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "financial_register_links" ADD CONSTRAINT "financial_register_links_ledger_entry_id_fkey" FOREIGN KEY ("ledger_entry_id") REFERENCES "financial_ledger_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "financial_register_links" ADD CONSTRAINT "financial_register_links_trust_deposit_id_fkey" FOREIGN KEY ("trust_deposit_id") REFERENCES "trust_deposits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "financial_compliance_events" (
    "id" TEXT NOT NULL,
    "owner_type" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "performed_by_id" TEXT,
    "ai_assisted" BOOLEAN NOT NULL DEFAULT false,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "financial_compliance_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_fin_compliance_owner" ON "financial_compliance_events"("owner_type", "owner_id");
CREATE INDEX "idx_fin_compliance_entity" ON "financial_compliance_events"("entity_type", "entity_id");
CREATE INDEX "idx_fin_compliance_event_type" ON "financial_compliance_events"("event_type");
