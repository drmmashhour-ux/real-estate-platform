-- Finance Admin Hub + Québec tax profile + regulatory obligations + exempt distribution + capital commitments.
-- Extends amf_spvs for private exempt default (no public offering workflow by default).

CREATE TYPE "AmfExemptionCategory" AS ENUM ('ACCREDITED_INVESTOR', 'FAMILY_FRIENDS_BUSINESS_ASSOCIATES');
CREATE TYPE "ExemptFilingFormStatus" AS ENUM ('DRAFT', 'READY', 'FILED');
CREATE TYPE "InvestorCapitalCommitmentStatus" AS ENUM ('PENDING', 'PARTIAL', 'FUNDED', 'CANCELLED');

ALTER TABLE "amf_spvs" ADD COLUMN "private_exempt_deal_mode" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "amf_spvs" ADD COLUMN "exemption_path" "AmfExemptionCategory";
ALTER TABLE "amf_spvs" ADD COLUMN "counsel_approved_exemptions_json" JSONB;

CREATE TYPE "FinAdminDomain" AS ENUM ('BROKERAGE', 'PLATFORM', 'INVESTMENT');
CREATE TYPE "FinAccountType" AS ENUM ('BANK', 'RECEIVABLE', 'PAYABLE', 'TAX', 'ESCROW_SIMULATION');
CREATE TYPE "FinLedgerEntryType" AS ENUM (
  'INVOICE', 'PAYMENT', 'COMMISSION', 'OACIQ_FEE', 'INSURANCE', 'GST', 'QST', 'AMF_FEE', 'LEGAL', 'DISTRIBUTION', 'REFUND'
);
CREATE TYPE "FinCounterpartyKind" AS ENUM ('CLIENT', 'BROKER', 'INVESTOR', 'GOVERNMENT', 'VENDOR', 'LAWYER', 'NOTARY');
CREATE TYPE "TaxFilingFrequency" AS ENUM ('MONTHLY', 'QUARTERLY', 'ANNUAL');
CREATE TYPE "RegulatoryAuthority" AS ENUM ('OACIQ', 'REVENU_QUEBEC', 'CRA', 'FARCIQ', 'AMF');
CREATE TYPE "RegulatoryObligationType" AS ENUM (
  'LICENCE_RENEWAL', 'INSURANCE_RENEWAL', 'GST_QST_RETURN', 'EXEMPT_DISTRIBUTION_REPORT', 'FEE_PAYMENT'
);
CREATE TYPE "RegulatoryObligationStatus" AS ENUM ('OPEN', 'DRAFT', 'FILED', 'PAID');

CREATE TABLE "compliance_finance_accounts" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(256) NOT NULL,
    "domain" "FinAdminDomain" NOT NULL,
    "type" "FinAccountType" NOT NULL,
    "currency" VARCHAR(8) NOT NULL DEFAULT 'CAD',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compliance_finance_accounts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "compliance_finance_accounts_domain_type_idx" ON "compliance_finance_accounts"("domain", "type");

CREATE TABLE "compliance_finance_counterparties" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(512) NOT NULL,
    "type" "FinCounterpartyKind" NOT NULL,
    "tax_number_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compliance_finance_counterparties_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "compliance_finance_ledger_entries" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "domain" "FinAdminDomain" NOT NULL,
    "entry_type" "FinLedgerEntryType" NOT NULL,
    "reference_type" VARCHAR(64) NOT NULL,
    "reference_id" VARCHAR(64),
    "amount" DECIMAL(18,2) NOT NULL,
    "tax_exclusive_amount" DECIMAL(18,2),
    "gst_amount" DECIMAL(18,2),
    "qst_amount" DECIMAL(18,2),
    "effective_date" TIMESTAMP(3) NOT NULL,
    "counterparty_id" TEXT,
    "notes_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compliance_finance_ledger_entries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "compliance_finance_ledger_entries_domain_effective_date_idx" ON "compliance_finance_ledger_entries"("domain", "effective_date");
CREATE INDEX "compliance_finance_ledger_entries_entry_type_effective_date_idx" ON "compliance_finance_ledger_entries"("entry_type", "effective_date");
CREATE INDEX "compliance_finance_ledger_entries_reference_type_reference_id_idx" ON "compliance_finance_ledger_entries"("reference_type", "reference_id");

ALTER TABLE "compliance_finance_ledger_entries" ADD CONSTRAINT "compliance_finance_ledger_entries_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "compliance_finance_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "compliance_finance_ledger_entries" ADD CONSTRAINT "compliance_finance_ledger_entries_counterparty_id_fkey" FOREIGN KEY ("counterparty_id") REFERENCES "compliance_finance_counterparties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "tax_registration_profiles" (
    "id" TEXT NOT NULL,
    "registrant_name" VARCHAR(512) NOT NULL,
    "gst_number" VARCHAR(64),
    "qst_number" VARCHAR(64),
    "filing_frequency" "TaxFilingFrequency" NOT NULL,
    "is_registered" BOOLEAN NOT NULL DEFAULT true,
    "effective_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tax_registration_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "regulatory_obligations" (
    "id" TEXT NOT NULL,
    "authority" "RegulatoryAuthority" NOT NULL,
    "obligation_type" "RegulatoryObligationType" NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "amount_estimate" DECIMAL(18,2),
    "status" "RegulatoryObligationStatus" NOT NULL DEFAULT 'OPEN',
    "reference_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "regulatory_obligations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "regulatory_obligations_authority_due_date_idx" ON "regulatory_obligations"("authority", "due_date");
CREATE INDEX "regulatory_obligations_status_due_date_idx" ON "regulatory_obligations"("status", "due_date");

CREATE TABLE "exempt_distribution_files" (
    "id" TEXT NOT NULL,
    "spv_id" TEXT NOT NULL,
    "exemption_type" "AmfExemptionCategory" NOT NULL,
    "distribution_date" TIMESTAMP(3) NOT NULL,
    "filing_deadline" TIMESTAMP(3) NOT NULL,
    "form_45_106f1_status" "ExemptFilingFormStatus" NOT NULL DEFAULT 'DRAFT',
    "amf_fee_amount" DECIMAL(18,2),
    "notes_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exempt_distribution_files_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "exempt_distribution_files_spv_id_distribution_date_idx" ON "exempt_distribution_files"("spv_id", "distribution_date");

ALTER TABLE "exempt_distribution_files" ADD CONSTRAINT "exempt_distribution_files_spv_id_fkey" FOREIGN KEY ("spv_id") REFERENCES "amf_spvs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "investor_capital_commitments" (
    "id" TEXT NOT NULL,
    "spv_id" TEXT NOT NULL,
    "investor_id" TEXT NOT NULL,
    "committed_amount" DECIMAL(18,2) NOT NULL,
    "received_amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "status" "InvestorCapitalCommitmentStatus" NOT NULL DEFAULT 'PENDING',
    "exemption_type" "AmfExemptionCategory" NOT NULL,
    "eligibility_recorded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "investor_capital_commitments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "investor_capital_commitments_spv_id_investor_id_key" ON "investor_capital_commitments"("spv_id", "investor_id");
CREATE INDEX "investor_capital_commitments_spv_id_status_idx" ON "investor_capital_commitments"("spv_id", "status");

ALTER TABLE "investor_capital_commitments" ADD CONSTRAINT "investor_capital_commitments_spv_id_fkey" FOREIGN KEY ("spv_id") REFERENCES "amf_spvs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "investor_capital_commitments" ADD CONSTRAINT "investor_capital_commitments_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed hub accounts (idempotent by fixed ids)
INSERT INTO "compliance_finance_accounts" ("id", "name", "domain", "type", "currency", "created_at", "updated_at")
VALUES
('hub_acct_broker_bank', 'Brokerage — operating (hub)', 'BROKERAGE', 'BANK', 'CAD', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('hub_acct_platform_bank', 'Platform — operating (hub)', 'PLATFORM', 'BANK', 'CAD', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('hub_acct_invest_bank', 'Investment — SPV cash (hub sim)', 'INVESTMENT', 'ESCROW_SIMULATION', 'CAD', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "tax_registration_profiles" ("id", "registrant_name", "gst_number", "qst_number", "filing_frequency", "is_registered", "effective_date", "created_at", "updated_at")
VALUES (
  'hub_tax_profile_default',
  'MOHAMED ALMASHHOUR',
  '766525877RT0001',
  '4025075621',
  'ANNUAL',
  true,
  '2024-07-23'::timestamp,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "regulatory_obligations" ("id", "authority", "obligation_type", "due_date", "amount_estimate", "status", "reference_json", "created_at", "updated_at")
VALUES
('hub_ob_oaciq_lic', 'OACIQ', 'LICENCE_RENEWAL', '2026-06-15'::timestamp, NULL, 'OPEN', '{"note":"OACIQ licence maintenance — confirm with brokerage calendar."}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('hub_ob_farciq', 'FARCIQ', 'INSURANCE_RENEWAL', '2026-09-01'::timestamp, NULL, 'OPEN', '{"note":"FARCIQ / professional liability renewal window (illustrative)."}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('hub_ob_gst_qst', 'REVENU_QUEBEC', 'GST_QST_RETURN', '2026-04-30'::timestamp, NULL, 'DRAFT', '{"note":"GST/QST filing — align with accountant-approved calendar."}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('hub_ob_amf_exempt', 'AMF', 'EXEMPT_DISTRIBUTION_REPORT', '2026-05-15'::timestamp, NULL, 'OPEN', '{"note":"Private placement reporting — Form 45-106F1 timeline depends on distribution facts."}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('hub_ob_cra', 'CRA', 'FEE_PAYMENT', '2026-04-30'::timestamp, NULL, 'OPEN', '{"note":"Federal instalments / filings as applicable — not legal advice."}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
