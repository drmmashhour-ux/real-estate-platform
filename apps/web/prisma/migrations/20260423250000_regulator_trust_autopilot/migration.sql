CREATE TABLE "regulator_export_runs" (
    "id" TEXT NOT NULL,
    "export_number" TEXT NOT NULL,
    "owner_type" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "export_type" TEXT NOT NULL,
    "scope_type" TEXT NOT NULL,
    "scope_id" TEXT,
    "status" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "requested_by_id" TEXT,
    "generated_at" TIMESTAMP(3),
    "sealed_at" TIMESTAMP(3),
    "manifest" JSONB,
    "file_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "regulator_export_runs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "regulator_export_runs_export_number_key" ON "regulator_export_runs"("export_number");
CREATE INDEX "idx_regulator_export_owner" ON "regulator_export_runs"("owner_type", "owner_id");

CREATE TABLE "trust_deposits" (
    "id" TEXT NOT NULL,
    "agency_id" TEXT,
    "broker_id" TEXT,
    "listing_id" TEXT,
    "deal_id" TEXT,
    "amount_cents" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'received',
    "receipt_number" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trust_deposits_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_trust_deposits_broker" ON "trust_deposits"("broker_id");
CREATE INDEX "idx_trust_deposits_agency" ON "trust_deposits"("agency_id");
CREATE INDEX "idx_trust_deposits_listing" ON "trust_deposits"("listing_id");
CREATE INDEX "idx_trust_deposits_deal" ON "trust_deposits"("deal_id");

CREATE TABLE "trust_ledger_entries" (
    "id" TEXT NOT NULL,
    "owner_type" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "trust_deposit_id" TEXT,
    "listing_id" TEXT,
    "deal_id" TEXT,
    "entry_type" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'CAD',
    "reference_number" TEXT,
    "notes" TEXT,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trust_ledger_entries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_trust_ledger_owner" ON "trust_ledger_entries"("owner_type", "owner_id");
CREATE INDEX "idx_trust_ledger_deposit" ON "trust_ledger_entries"("trust_deposit_id");

ALTER TABLE "trust_ledger_entries" ADD CONSTRAINT "trust_ledger_entries_trust_deposit_id_fkey" FOREIGN KEY ("trust_deposit_id") REFERENCES "trust_deposits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "trust_reconciliation_runs" (
    "id" TEXT NOT NULL,
    "run_number" TEXT NOT NULL,
    "owner_type" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "total_deposits_cents" INTEGER NOT NULL,
    "total_ledger_cents" INTEGER NOT NULL,
    "difference_cents" INTEGER NOT NULL,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trust_reconciliation_runs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "trust_reconciliation_runs_run_number_key" ON "trust_reconciliation_runs"("run_number");
CREATE INDEX "idx_trust_recon_owner" ON "trust_reconciliation_runs"("owner_type", "owner_id");

CREATE TABLE "ai_autopilot_proposals" (
    "id" TEXT NOT NULL,
    "owner_type" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "module_key" TEXT NOT NULL,
    "proposal_type" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "content" JSONB NOT NULL,
    "rationale" TEXT,
    "source_summary" JSONB,
    "requires_review" BOOLEAN NOT NULL DEFAULT true,
    "reviewed" BOOLEAN NOT NULL DEFAULT false,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "reviewed_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_autopilot_proposals_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_ai_autopilot_owner" ON "ai_autopilot_proposals"("owner_type", "owner_id");

CREATE TABLE "cash_receipt_forms" (
    "id" TEXT NOT NULL,
    "owner_type" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "listing_id" TEXT,
    "amount_cents" INTEGER,
    "payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cash_receipt_forms_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_cash_receipt_owner" ON "cash_receipt_forms"("owner_type", "owner_id");
