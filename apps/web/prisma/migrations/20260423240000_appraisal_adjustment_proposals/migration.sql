-- Appraisal adjustment proposals (valuation support; DealAnalysis id = appraisal case)

CREATE TABLE "appraisal_adjustment_proposals" (
    "id" TEXT NOT NULL,
    "appraisal_case_id" TEXT NOT NULL,
    "comparable_id" TEXT,
    "adjustment_type" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "suggested_amount_cents" INTEGER NOT NULL,
    "direction" TEXT NOT NULL,
    "rationale" TEXT,
    "confidence" DOUBLE PRECISION,
    "source_type" TEXT,
    "source_summary" JSONB,
    "reviewed" BOOLEAN NOT NULL DEFAULT false,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "reviewed_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appraisal_adjustment_proposals_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "appraisal_adjustments" (
    "id" TEXT NOT NULL,
    "proposal_id" TEXT,
    "appraisal_case_id" TEXT NOT NULL,
    "comparable_id" TEXT,
    "adjustment_type" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "direction" TEXT NOT NULL,
    "rationale" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "appraisal_adjustments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "appraisal_adjustments_proposal_id_key" ON "appraisal_adjustments"("proposal_id");

CREATE INDEX "idx_appraisal_adj_props_case" ON "appraisal_adjustment_proposals"("appraisal_case_id");
CREATE INDEX "idx_appraisal_adj_props_comp" ON "appraisal_adjustment_proposals"("comparable_id");
CREATE INDEX "idx_appraisal_adj_applied_case" ON "appraisal_adjustments"("appraisal_case_id");

ALTER TABLE "appraisal_adjustment_proposals" ADD CONSTRAINT "appraisal_adjustment_proposals_appraisal_case_id_fkey" FOREIGN KEY ("appraisal_case_id") REFERENCES "deal_analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "appraisal_adjustment_proposals" ADD CONSTRAINT "appraisal_adjustment_proposals_comparable_id_fkey" FOREIGN KEY ("comparable_id") REFERENCES "deal_analysis_comparables"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "appraisal_adjustments" ADD CONSTRAINT "appraisal_adjustments_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "appraisal_adjustment_proposals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "appraisal_adjustments" ADD CONSTRAINT "appraisal_adjustments_appraisal_case_id_fkey" FOREIGN KEY ("appraisal_case_id") REFERENCES "deal_analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "appraisal_adjustments" ADD CONSTRAINT "appraisal_adjustments_comparable_id_fkey" FOREIGN KEY ("comparable_id") REFERENCES "deal_analysis_comparables"("id") ON DELETE SET NULL ON UPDATE CASCADE;
