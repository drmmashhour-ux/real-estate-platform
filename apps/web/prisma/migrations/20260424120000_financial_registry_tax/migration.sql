CREATE TABLE "lecipm_financial_transaction_records" (
    "id" TEXT NOT NULL,
    "owner_type" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "listing_id" TEXT,
    "deal_id" TEXT,
    "contract_id" TEXT,
    "contract_number" TEXT,
    "transaction_type" TEXT NOT NULL,
    "transaction_status" TEXT NOT NULL,
    "buyer_name" TEXT,
    "seller_name" TEXT,
    "gross_price_cents" INTEGER,
    "commission_base_cents" INTEGER,
    "commission_total_cents" INTEGER,
    "broker_amount_cents" INTEGER,
    "agency_amount_cents" INTEGER,
    "platform_amount_cents" INTEGER,
    "closing_date" TIMESTAMP(3),
    "notes" TEXT,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lecipm_financial_transaction_records_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_transaction_record_owner" ON "lecipm_financial_transaction_records"("owner_type", "owner_id");

CREATE TABLE "lecipm_tax_records" (
    "id" TEXT NOT NULL,
    "owner_type" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "transaction_record_id" TEXT,
    "related_type" TEXT NOT NULL,
    "related_id" TEXT,
    "taxable_base_cents" INTEGER NOT NULL,
    "gst_cents" INTEGER NOT NULL,
    "qst_cents" INTEGER NOT NULL,
    "total_with_tax_cents" INTEGER NOT NULL,
    "tax_rate_gst" DOUBLE PRECISION NOT NULL,
    "tax_rate_qst" DOUBLE PRECISION NOT NULL,
    "reporting_period_key" TEXT,
    "reported" BOOLEAN NOT NULL DEFAULT false,
    "reported_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lecipm_tax_records_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_tax_record_owner" ON "lecipm_tax_records"("owner_type", "owner_id");
CREATE INDEX "idx_tax_record_period" ON "lecipm_tax_records"("reporting_period_key");

ALTER TABLE "lecipm_tax_records" ADD CONSTRAINT "lecipm_tax_records_transaction_record_id_fkey" FOREIGN KEY ("transaction_record_id") REFERENCES "lecipm_financial_transaction_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "revenu_quebec_profiles" (
    "id" TEXT NOT NULL,
    "owner_type" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "legal_name" TEXT,
    "business_director_name" TEXT,
    "gst_account_number" TEXT,
    "qst_file_number" TEXT,
    "gst_account_number_masked" TEXT,
    "qst_file_number_masked" TEXT,
    "neq" TEXT,
    "reporting_frequency" TEXT,
    "first_period_start" TIMESTAMP(3),
    "first_period_end" TIMESTAMP(3),
    "first_return_due_at" TIMESTAMP(3),
    "source_document_name" TEXT,
    "source_document_stored" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "revenu_quebec_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uq_revenu_quebec_profile_owner" ON "revenu_quebec_profiles"("owner_type", "owner_id");

CREATE TABLE "financial_dashboard_snapshots" (
    "id" TEXT NOT NULL,
    "owner_type" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "metrics" JSONB NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "financial_dashboard_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_fin_dashboard_snapshot_owner" ON "financial_dashboard_snapshots"("owner_type", "owner_id");
