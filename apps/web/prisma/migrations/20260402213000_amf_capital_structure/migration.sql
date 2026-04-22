-- AMF-aligned capital structure: SPV per deal, investors, investments, disclosures, distributions.

CREATE TABLE "amf_capital_deals" (
    "id" TEXT NOT NULL,
    "listing_id" VARCHAR(36),
    "sponsor_user_id" VARCHAR(36),
    "title" VARCHAR(512) NOT NULL,
    "status" VARCHAR(24) NOT NULL DEFAULT 'DRAFT',
    "solicitation_mode" VARCHAR(40) NOT NULL DEFAULT 'PRIVATE_PLACEMENT',
    "allows_public_marketing" BOOLEAN NOT NULL DEFAULT false,
    "exemption_narrative" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "amf_capital_deals_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "amf_spv_companies" (
    "id" TEXT NOT NULL,
    "capital_deal_id" VARCHAR(36) NOT NULL,
    "legal_name" VARCHAR(512) NOT NULL,
    "registration_number" VARCHAR(64),
    "jurisdiction" VARCHAR(8) NOT NULL DEFAULT 'QC',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "amf_spv_companies_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "amf_investors" (
    "id" TEXT NOT NULL,
    "user_id" VARCHAR(36),
    "legal_name" VARCHAR(512) NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "accreditation_status" VARCHAR(24) NOT NULL DEFAULT 'PENDING',
    "kyc_status" VARCHAR(24) NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "amf_investors_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "amf_investments" (
    "id" TEXT NOT NULL,
    "capital_deal_id" VARCHAR(36) NOT NULL,
    "investor_id" VARCHAR(36) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "equity_percentage" DOUBLE PRECISION,
    "status" VARCHAR(24) NOT NULL DEFAULT 'PENDING',
    "disclosures_acknowledged_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "amf_investments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "amf_deal_disclosures" (
    "id" TEXT NOT NULL,
    "capital_deal_id" VARCHAR(36) NOT NULL,
    "doc_type" VARCHAR(40) NOT NULL,
    "title" VARCHAR(512) NOT NULL,
    "storage_url" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "amf_deal_disclosures_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "amf_disclosure_acknowledgments" (
    "id" TEXT NOT NULL,
    "capital_deal_id" VARCHAR(36) NOT NULL,
    "investor_id" VARCHAR(36) NOT NULL,
    "disclosure_id" VARCHAR(36) NOT NULL,
    "acknowledged_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "amf_disclosure_acknowledgments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "amf_distribution_records" (
    "id" TEXT NOT NULL,
    "capital_deal_id" VARCHAR(36) NOT NULL,
    "investor_id" VARCHAR(36),
    "kind" VARCHAR(40) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "amf_distribution_records_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "amf_spv_companies_capital_deal_id_key" ON "amf_spv_companies"("capital_deal_id");

CREATE UNIQUE INDEX "amf_investors_user_id_key" ON "amf_investors"("user_id");

CREATE UNIQUE INDEX "amf_investors_email_key" ON "amf_investors"("email");

CREATE UNIQUE INDEX "amf_investments_capital_deal_id_investor_id_key" ON "amf_investments"("capital_deal_id", "investor_id");

CREATE UNIQUE INDEX "amf_disclosure_acknowledgments_investor_id_disclosure_id_key" ON "amf_disclosure_acknowledgments"("investor_id", "disclosure_id");

CREATE INDEX "amf_capital_deals_listing_id_idx" ON "amf_capital_deals"("listing_id");

CREATE INDEX "amf_capital_deals_sponsor_user_id_status_idx" ON "amf_capital_deals"("sponsor_user_id", "status");

CREATE INDEX "amf_investments_investor_id_idx" ON "amf_investments"("investor_id");

CREATE INDEX "amf_deal_disclosures_capital_deal_id_doc_type_idx" ON "amf_deal_disclosures"("capital_deal_id", "doc_type");

CREATE INDEX "amf_disclosure_acknowledgments_capital_deal_id_investor_id_idx" ON "amf_disclosure_acknowledgments"("capital_deal_id", "investor_id");

CREATE INDEX "amf_distribution_records_capital_deal_id_recorded_at_idx" ON "amf_distribution_records"("capital_deal_id", "recorded_at");

CREATE INDEX "amf_distribution_records_investor_id_idx" ON "amf_distribution_records"("investor_id");

CREATE INDEX "amf_investors_kyc_status_accreditation_status_idx" ON "amf_investors"("kyc_status", "accreditation_status");

ALTER TABLE "amf_capital_deals" ADD CONSTRAINT "amf_capital_deals_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "amf_capital_deals" ADD CONSTRAINT "amf_capital_deals_sponsor_user_id_fkey" FOREIGN KEY ("sponsor_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "amf_spv_companies" ADD CONSTRAINT "amf_spv_companies_capital_deal_id_fkey" FOREIGN KEY ("capital_deal_id") REFERENCES "amf_capital_deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "amf_investors" ADD CONSTRAINT "amf_investors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "amf_investments" ADD CONSTRAINT "amf_investments_capital_deal_id_fkey" FOREIGN KEY ("capital_deal_id") REFERENCES "amf_capital_deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "amf_investments" ADD CONSTRAINT "amf_investments_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "amf_investors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "amf_deal_disclosures" ADD CONSTRAINT "amf_deal_disclosures_capital_deal_id_fkey" FOREIGN KEY ("capital_deal_id") REFERENCES "amf_capital_deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "amf_disclosure_acknowledgments" ADD CONSTRAINT "amf_disclosure_acknowledgments_capital_deal_id_fkey" FOREIGN KEY ("capital_deal_id") REFERENCES "amf_capital_deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "amf_disclosure_acknowledgments" ADD CONSTRAINT "amf_disclosure_acknowledgments_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "amf_investors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "amf_disclosure_acknowledgments" ADD CONSTRAINT "amf_disclosure_acknowledgments_disclosure_id_fkey" FOREIGN KEY ("disclosure_id") REFERENCES "amf_deal_disclosures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "amf_distribution_records" ADD CONSTRAINT "amf_distribution_records_capital_deal_id_fkey" FOREIGN KEY ("capital_deal_id") REFERENCES "amf_capital_deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "amf_distribution_records" ADD CONSTRAINT "amf_distribution_records_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "amf_investors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
