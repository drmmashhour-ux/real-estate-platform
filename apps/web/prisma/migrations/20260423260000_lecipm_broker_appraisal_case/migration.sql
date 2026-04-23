CREATE TABLE "lecipm_broker_appraisal_cases" (
    "id" TEXT NOT NULL,
    "broker_user_id" TEXT NOT NULL,
    "subject_listing_id" TEXT NOT NULL,
    "deal_analysis_id" TEXT,
    "title" TEXT,
    "report_number" TEXT,
    "comparables_reviewed" BOOLEAN NOT NULL DEFAULT false,
    "adjustments_reviewed" BOOLEAN NOT NULL DEFAULT false,
    "assumptions_reviewed" BOOLEAN NOT NULL DEFAULT false,
    "conclusion_reviewed" BOOLEAN NOT NULL DEFAULT false,
    "broker_approved" BOOLEAN NOT NULL DEFAULT false,
    "report_draft_json" JSONB,
    "report_reviewed_at" TIMESTAMP(3),
    "value_indication_cents" INTEGER,
    "finalized_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lecipm_broker_appraisal_cases_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "lecipm_broker_appraisal_cases_deal_analysis_id_key" ON "lecipm_broker_appraisal_cases"("deal_analysis_id");
CREATE UNIQUE INDEX "lecipm_broker_appraisal_cases_report_number_key" ON "lecipm_broker_appraisal_cases"("report_number");
CREATE INDEX "idx_lecipm_broker_appraisal_broker" ON "lecipm_broker_appraisal_cases"("broker_user_id");
CREATE INDEX "idx_lecipm_broker_appraisal_listing" ON "lecipm_broker_appraisal_cases"("subject_listing_id");

ALTER TABLE "lecipm_broker_appraisal_cases" ADD CONSTRAINT "lecipm_broker_appraisal_cases_deal_analysis_id_fkey" FOREIGN KEY ("deal_analysis_id") REFERENCES "deal_analyses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
