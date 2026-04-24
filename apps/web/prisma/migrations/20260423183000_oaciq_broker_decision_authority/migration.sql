-- OACIQ broker decision authority: audit log + denormalized approval timestamps

CREATE TYPE "OaciqBrokerDecisionType" AS ENUM (
  'PIPELINE_DEAL_CREATE',
  'CRM_DEAL_CREATE',
  'OFFER_SUBMIT',
  'CONTRACT_GENERATE',
  'LISTING_PUBLISH',
  'NEGOTIATION_STEP',
  'CONTRACT_SIGN'
);

CREATE TABLE "oaciq_broker_decision_logs" (
    "id" TEXT NOT NULL,
    "broker_id" TEXT NOT NULL,
    "decision_type" "OaciqBrokerDecisionType" NOT NULL,
    "approved_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmation_text_version" VARCHAR(64) NOT NULL DEFAULT 'v1_broker_decision_2026',
    "crm_deal_id" VARCHAR(36),
    "pipeline_deal_id" VARCHAR(36),
    "real_estate_transaction_id" VARCHAR(36),
    "listing_id" VARCHAR(36),
    "listing_offer_id" VARCHAR(36),
    "property_offer_id" VARCHAR(36),
    "legal_document_artifact_id" VARCHAR(36),
    "negotiation_strategy_id" VARCHAR(36),
    "metadata" JSONB,

    CONSTRAINT "oaciq_broker_decision_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "oaciq_broker_decision_logs_broker_id_decision_type_approved_at_idx" ON "oaciq_broker_decision_logs"("broker_id", "decision_type", "approved_at" DESC);
CREATE INDEX "oaciq_broker_decision_logs_real_estate_transaction_id_decision_ty_idx" ON "oaciq_broker_decision_logs"("real_estate_transaction_id", "decision_type", "approved_at" DESC);
CREATE INDEX "oaciq_broker_decision_logs_listing_id_decision_type_approved_at_idx" ON "oaciq_broker_decision_logs"("listing_id", "decision_type", "approved_at" DESC);
CREATE INDEX "oaciq_broker_decision_logs_pipeline_deal_id_idx" ON "oaciq_broker_decision_logs"("pipeline_deal_id");
CREATE INDEX "oaciq_broker_decision_logs_crm_deal_id_idx" ON "oaciq_broker_decision_logs"("crm_deal_id");

ALTER TABLE "oaciq_broker_decision_logs" ADD CONSTRAINT "oaciq_broker_decision_logs_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "deals" ADD COLUMN IF NOT EXISTS "broker_decision_approved_by_id" TEXT;
ALTER TABLE "deals" ADD COLUMN IF NOT EXISTS "broker_decision_approved_at" TIMESTAMP(3);

ALTER TABLE "lecipm_pipeline_deals" ADD COLUMN IF NOT EXISTS "broker_decision_approved_by_id" VARCHAR(36);
ALTER TABLE "lecipm_pipeline_deals" ADD COLUMN IF NOT EXISTS "broker_decision_approved_at" TIMESTAMP(3);
