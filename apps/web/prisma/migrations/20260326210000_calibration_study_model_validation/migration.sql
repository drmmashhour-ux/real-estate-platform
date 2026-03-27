-- LECIPM calibration study — replaces prior minimal model_validation_* tables if present.

DROP TABLE IF EXISTS "model_validation_items";
DROP TABLE IF EXISTS "model_validation_runs";

DROP TYPE IF EXISTS "ModelValidationRunStatus";

CREATE TYPE "ModelValidationRunStatus" AS ENUM ('draft', 'in_progress', 'completed', 'archived');

CREATE TABLE "model_validation_runs" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "status" "ModelValidationRunStatus" NOT NULL DEFAULT 'draft',
    "created_by" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(6),

    CONSTRAINT "model_validation_runs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "model_validation_runs_created_at_idx" ON "model_validation_runs"("created_at");
CREATE INDEX "model_validation_runs_status_idx" ON "model_validation_runs"("status");

CREATE TABLE "model_validation_items" (
    "id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "predicted_trust_score" INTEGER,
    "predicted_trust_confidence" INTEGER,
    "predicted_deal_score" INTEGER,
    "predicted_deal_confidence" INTEGER,
    "predicted_fraud_score" INTEGER,
    "predicted_recommendation" TEXT,
    "predicted_issue_codes" JSONB,
    "human_trust_label" TEXT,
    "human_deal_label" TEXT,
    "human_risk_label" TEXT,
    "fairness_rating" INTEGER,
    "would_publish" BOOLEAN,
    "would_contact" BOOLEAN,
    "would_investigate_further" BOOLEAN,
    "needs_manual_review" BOOLEAN,
    "reviewer_notes" TEXT,
    "agreement_trust" BOOLEAN,
    "agreement_deal" BOOLEAN,
    "agreement_risk" BOOLEAN,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "model_validation_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uq_model_validation_item_run_entity" ON "model_validation_items"("run_id", "entity_type", "entity_id");
CREATE INDEX "model_validation_items_run_id_idx" ON "model_validation_items"("run_id");
CREATE INDEX "model_validation_items_entity_type_entity_id_idx" ON "model_validation_items"("entity_type", "entity_id");

ALTER TABLE "model_validation_items" ADD CONSTRAINT "model_validation_items_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "model_validation_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
