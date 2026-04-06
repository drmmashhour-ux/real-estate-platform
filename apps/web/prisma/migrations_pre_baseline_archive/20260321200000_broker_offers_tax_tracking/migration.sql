-- Offer documents, broker transaction / expense tracking, tax report snapshots

CREATE TABLE IF NOT EXISTS "offer_documents" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "listing_id" TEXT,
    "lead_id" TEXT,
    "contract_id" TEXT,
    "created_by_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "offer_price_cents" INTEGER,
    "conditions_json" JSONB,
    "content_html" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "offer_documents_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "offer_documents_contract_id_key" ON "offer_documents"("contract_id");
CREATE INDEX IF NOT EXISTS "offer_documents_listing_id_idx" ON "offer_documents"("listing_id");
CREATE INDEX IF NOT EXISTS "offer_documents_lead_id_idx" ON "offer_documents"("lead_id");
CREATE INDEX IF NOT EXISTS "offer_documents_created_by_id_idx" ON "offer_documents"("created_by_id");
CREATE INDEX IF NOT EXISTS "offer_documents_status_idx" ON "offer_documents"("status");
CREATE INDEX IF NOT EXISTS "offer_documents_type_idx" ON "offer_documents"("type");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'offer_documents_listing_id_fkey') THEN
    ALTER TABLE "offer_documents" ADD CONSTRAINT "offer_documents_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "ShortTermListing"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'offer_documents_lead_id_fkey') THEN
    ALTER TABLE "offer_documents" ADD CONSTRAINT "offer_documents_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'offer_documents_contract_id_fkey') THEN
    ALTER TABLE "offer_documents" ADD CONSTRAINT "offer_documents_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'offer_documents_created_by_id_fkey') THEN
    ALTER TABLE "offer_documents" ADD CONSTRAINT "offer_documents_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "broker_transaction_records" (
    "id" TEXT NOT NULL,
    "broker_id" TEXT NOT NULL,
    "lead_id" TEXT,
    "contract_id" TEXT,
    "offer_document_id" TEXT,
    "transaction_type" TEXT NOT NULL,
    "outcome" TEXT NOT NULL DEFAULT 'pending',
    "gross_revenue_cents" INTEGER NOT NULL DEFAULT 0,
    "broker_commission_cents" INTEGER NOT NULL DEFAULT 0,
    "platform_commission_cents" INTEGER NOT NULL DEFAULT 0,
    "expenses_cents" INTEGER NOT NULL DEFAULT 0,
    "net_broker_income_cents" INTEGER NOT NULL DEFAULT 0,
    "loss_reason" TEXT,
    "notes" TEXT,
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "broker_transaction_records_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "broker_transaction_records_broker_id_idx" ON "broker_transaction_records"("broker_id");
CREATE INDEX IF NOT EXISTS "broker_transaction_records_outcome_idx" ON "broker_transaction_records"("outcome");
CREATE INDEX IF NOT EXISTS "broker_transaction_records_lead_id_idx" ON "broker_transaction_records"("lead_id");
CREATE INDEX IF NOT EXISTS "broker_transaction_records_transaction_type_idx" ON "broker_transaction_records"("transaction_type");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'broker_transaction_records_broker_id_fkey') THEN
    ALTER TABLE "broker_transaction_records" ADD CONSTRAINT "broker_transaction_records_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'broker_transaction_records_lead_id_fkey') THEN
    ALTER TABLE "broker_transaction_records" ADD CONSTRAINT "broker_transaction_records_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'broker_transaction_records_contract_id_fkey') THEN
    ALTER TABLE "broker_transaction_records" ADD CONSTRAINT "broker_transaction_records_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'broker_transaction_records_offer_document_id_fkey') THEN
    ALTER TABLE "broker_transaction_records" ADD CONSTRAINT "broker_transaction_records_offer_document_id_fkey" FOREIGN KEY ("offer_document_id") REFERENCES "offer_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "broker_expenses" (
    "id" TEXT NOT NULL,
    "broker_id" TEXT NOT NULL,
    "transaction_record_id" TEXT,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "amount_cents" INTEGER NOT NULL,
    "tax_gst_cents" INTEGER NOT NULL DEFAULT 0,
    "tax_qst_cents" INTEGER NOT NULL DEFAULT 0,
    "expense_date" TIMESTAMP(3) NOT NULL,
    "receipt_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "broker_expenses_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "broker_expenses_broker_id_idx" ON "broker_expenses"("broker_id");
CREATE INDEX IF NOT EXISTS "broker_expenses_transaction_record_id_idx" ON "broker_expenses"("transaction_record_id");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'broker_expenses_broker_id_fkey') THEN
    ALTER TABLE "broker_expenses" ADD CONSTRAINT "broker_expenses_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'broker_expenses_transaction_record_id_fkey') THEN
    ALTER TABLE "broker_expenses" ADD CONSTRAINT "broker_expenses_transaction_record_id_fkey" FOREIGN KEY ("transaction_record_id") REFERENCES "broker_transaction_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "tax_report_snapshots" (
    "id" TEXT NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "gst_collected_cents" INTEGER NOT NULL DEFAULT 0,
    "qst_collected_cents" INTEGER NOT NULL DEFAULT 0,
    "taxable_revenue_cents" INTEGER NOT NULL DEFAULT 0,
    "non_taxable_revenue_cents" INTEGER NOT NULL DEFAULT 0,
    "source_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tax_report_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "tax_report_snapshots_period_start_idx" ON "tax_report_snapshots"("period_start");
CREATE INDEX IF NOT EXISTS "tax_report_snapshots_period_end_idx" ON "tax_report_snapshots"("period_end");
