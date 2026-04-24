-- AMF-aligned private placement: deal-scoped SPV, exemption checklist, investor eligibility (simulation-first).

ALTER TABLE "amf_spvs" ADD COLUMN "deal_id" TEXT;
ALTER TABLE "amf_spvs" ADD COLUMN "issuer_legal_name" VARCHAR(512);
ALTER TABLE "amf_spvs" ADD COLUMN "issuer_type" VARCHAR(32) NOT NULL DEFAULT 'SPV';
ALTER TABLE "amf_spvs" ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "amf_spvs" ADD COLUMN "counsel_approved_real_mode" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX "amf_spvs_deal_id_key" ON "amf_spvs"("deal_id");

ALTER TABLE "amf_spvs" ADD CONSTRAINT "amf_spvs_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "exempt_distribution_files" ADD COLUMN "document_checklist_json" JSONB NOT NULL DEFAULT '{}';

ALTER TABLE "crm_deal_investor_commitments" ADD COLUMN "exemption_type" "AmfExemptionCategory";
ALTER TABLE "crm_deal_investor_commitments" ADD COLUMN "exemption_recorded_at" TIMESTAMP(3);

CREATE TABLE "investor_eligibility_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "jurisdiction" VARCHAR(16) NOT NULL DEFAULT 'QC',
    "questionnaire_json" JSONB NOT NULL DEFAULT '{}',
    "classified_exemption" "AmfExemptionCategory",
    "blocked_reason" TEXT,
    "classified_at" TIMESTAMP(3),
    "classified_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investor_eligibility_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "investor_eligibility_profiles_user_id_key" ON "investor_eligibility_profiles"("user_id");
ALTER TABLE "investor_eligibility_profiles" ADD CONSTRAINT "investor_eligibility_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "investor_exemption_records" (
    "id" TEXT NOT NULL,
    "exempt_distribution_file_id" TEXT NOT NULL,
    "investor_user_id" TEXT NOT NULL,
    "exemption_type" "AmfExemptionCategory" NOT NULL,
    "classification_snapshot_json" JSONB NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recorded_by_user_id" TEXT,

    CONSTRAINT "investor_exemption_records_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "investor_exemption_records_exempt_distribution_file_id_investor_user_id_key" ON "investor_exemption_records"("exempt_distribution_file_id", "investor_user_id");
CREATE INDEX "investor_exemption_records_investor_user_id_idx" ON "investor_exemption_records"("investor_user_id");

ALTER TABLE "investor_exemption_records" ADD CONSTRAINT "investor_exemption_records_exempt_distribution_file_id_fkey" FOREIGN KEY ("exempt_distribution_file_id") REFERENCES "exempt_distribution_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "investor_exemption_records" ADD CONSTRAINT "investor_exemption_records_investor_user_id_fkey" FOREIGN KEY ("investor_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
