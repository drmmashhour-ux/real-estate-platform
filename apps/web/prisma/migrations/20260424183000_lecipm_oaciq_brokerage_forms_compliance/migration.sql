-- LECIPM OACIQ brokerage contracts, CRM seller declarations, disclosures, identity proofs, audit logs (additive)

CREATE TYPE "OaciqMandatoryFormVersion" AS ENUM ('2022_mandatory');
CREATE TYPE "BrokerageContractType" AS ENUM ('exclusive', 'non_exclusive');
CREATE TYPE "BrokerageContractStatus" AS ENUM ('draft', 'active', 'expired', 'terminated');
CREATE TYPE "DeclarationDisclosureMethod" AS ENUM ('auto', 'broker_manual');
CREATE TYPE "ComplianceFormEntityType" AS ENUM ('contract', 'declaration', 'identity');
CREATE TYPE "ComplianceFormAction" AS ENUM ('created', 'updated', 'signed', 'refused', 'validated', 'expired', 'version_checked');
CREATE TYPE "LecipmIdentityProofMethod" AS ENUM ('in_person', 'remote');
CREATE TYPE "LecipmIdentityProofVisibility" AS ENUM ('broker_only', 'compliance_only');

ALTER TABLE "Listing" ADD COLUMN "lecipm_oaciq_compliance_hold_at" TIMESTAMP(3);
ALTER TABLE "Listing" ADD COLUMN "lecipm_oaciq_compliance_hold_reason" VARCHAR(64);

CREATE TABLE "brokerage_contracts" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "broker_id" TEXT NOT NULL,
    "agency_id" TEXT,
    "contract_type" "BrokerageContractType" NOT NULL,
    "status" "BrokerageContractStatus" NOT NULL DEFAULT 'draft',
    "start_date" DATE,
    "end_date" DATE,
    "includes_distribution_authorization" BOOLEAN NOT NULL DEFAULT false,
    "distribution_scope" JSONB,
    "form_version" "OaciqMandatoryFormVersion" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brokerage_contracts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "brokerage_contracts_listing_id_key" ON "brokerage_contracts"("listing_id");
CREATE INDEX "brokerage_contracts_broker_id_idx" ON "brokerage_contracts"("broker_id");
CREATE INDEX "brokerage_contracts_agency_id_idx" ON "brokerage_contracts"("agency_id");

ALTER TABLE "brokerage_contracts" ADD CONSTRAINT "brokerage_contracts_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "brokerage_contracts" ADD CONSTRAINT "brokerage_contracts_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "brokerage_contracts" ADD CONSTRAINT "brokerage_contracts_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "lecipm_crm_oaciq_seller_declarations" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "form_version" "OaciqMandatoryFormVersion" NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "signed" BOOLEAN NOT NULL DEFAULT false,
    "refused" BOOLEAN NOT NULL DEFAULT false,
    "refusal_reason" TEXT,
    "submitted_at" TIMESTAMP(3),
    "signed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lecipm_crm_oaciq_seller_declarations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "lecipm_crm_oaciq_seller_declarations_listing_id_seller_id_key" ON "lecipm_crm_oaciq_seller_declarations"("listing_id", "seller_id");
CREATE INDEX "lecipm_crm_oaciq_seller_declarations_listing_id_idx" ON "lecipm_crm_oaciq_seller_declarations"("listing_id");

ALTER TABLE "lecipm_crm_oaciq_seller_declarations" ADD CONSTRAINT "lecipm_crm_oaciq_seller_declarations_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lecipm_crm_oaciq_seller_declarations" ADD CONSTRAINT "lecipm_crm_oaciq_seller_declarations_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "declaration_disclosures" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "declaration_id" TEXT NOT NULL,
    "disclosed_to_buyer" BOOLEAN NOT NULL DEFAULT false,
    "disclosure_timestamp" TIMESTAMP(3),
    "disclosure_method" "DeclarationDisclosureMethod",
    "buyer_acknowledged_at" TIMESTAMP(3),
    "buyer_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "declaration_disclosures_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "declaration_disclosures_declaration_id_key" ON "declaration_disclosures"("declaration_id");
CREATE INDEX "declaration_disclosures_listing_id_idx" ON "declaration_disclosures"("listing_id");

ALTER TABLE "declaration_disclosures" ADD CONSTRAINT "declaration_disclosures_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "declaration_disclosures" ADD CONSTRAINT "declaration_disclosures_declaration_id_fkey" FOREIGN KEY ("declaration_id") REFERENCES "lecipm_crm_oaciq_seller_declarations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "declaration_disclosures" ADD CONSTRAINT "declaration_disclosures_buyer_user_id_fkey" FOREIGN KEY ("buyer_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "lecipm_brokerage_identity_proofs" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "seller_user_id" TEXT NOT NULL,
    "verified_by_broker_id" TEXT NOT NULL,
    "verification_method" "LecipmIdentityProofMethod" NOT NULL,
    "document_type" VARCHAR(64) NOT NULL,
    "document_reference_hash" VARCHAR(128) NOT NULL,
    "verified_at" TIMESTAMP(3) NOT NULL,
    "confidential" BOOLEAN NOT NULL DEFAULT true,
    "visible_to" "LecipmIdentityProofVisibility" NOT NULL DEFAULT 'broker_only',
    "attachable_to_transaction_documents" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lecipm_brokerage_identity_proofs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "lecipm_brokerage_identity_proofs_listing_id_seller_user_id_key" ON "lecipm_brokerage_identity_proofs"("listing_id", "seller_user_id");
CREATE INDEX "lecipm_brokerage_identity_proofs_verified_by_broker_id_idx" ON "lecipm_brokerage_identity_proofs"("verified_by_broker_id");

ALTER TABLE "lecipm_brokerage_identity_proofs" ADD CONSTRAINT "lecipm_brokerage_identity_proofs_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lecipm_brokerage_identity_proofs" ADD CONSTRAINT "lecipm_brokerage_identity_proofs_seller_user_id_fkey" FOREIGN KEY ("seller_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lecipm_brokerage_identity_proofs" ADD CONSTRAINT "lecipm_brokerage_identity_proofs_verified_by_broker_id_fkey" FOREIGN KEY ("verified_by_broker_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "compliance_form_logs" (
    "id" TEXT NOT NULL,
    "entity_type" "ComplianceFormEntityType" NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" "ComplianceFormAction" NOT NULL,
    "performed_by_user_id" TEXT,
    "ai_assisted" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compliance_form_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "compliance_form_logs_entity_type_entity_id_idx" ON "compliance_form_logs"("entity_type", "entity_id");
CREATE INDEX "compliance_form_logs_created_at_idx" ON "compliance_form_logs"("created_at");

ALTER TABLE "compliance_form_logs" ADD CONSTRAINT "compliance_form_logs_performed_by_user_id_fkey" FOREIGN KEY ("performed_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
