-- Phase 5: pipeline deal capital stack, lenders, offers, financing conditions, closing readiness
ALTER TABLE "lecipm_pipeline_deals" ADD COLUMN "last_offer_compared_at" TIMESTAMP(3);

CREATE TABLE "lecipm_pipeline_deal_capital_stacks" (
    "id" TEXT NOT NULL,
    "deal_id" VARCHAR(36) NOT NULL,
    "total_purchase_price" DOUBLE PRECISION NOT NULL,
    "equity_amount" DOUBLE PRECISION,
    "debt_amount" DOUBLE PRECISION,
    "loan_to_value" DOUBLE PRECISION,
    "debt_service_coverage" DOUBLE PRECISION,
    "noi_annual" DOUBLE PRECISION,
    "annual_debt_service" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "lecipm_pipeline_deal_capital_stacks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "lecipm_pipeline_deal_capital_stacks_deal_id_key" ON "lecipm_pipeline_deal_capital_stacks"("deal_id");

CREATE TABLE "lecipm_pipeline_deal_lenders" (
    "id" TEXT NOT NULL,
    "deal_id" VARCHAR(36) NOT NULL,
    "lender_name" VARCHAR(512) NOT NULL,
    "contact_name" VARCHAR(256),
    "contact_email" VARCHAR(320),
    "status" VARCHAR(24) NOT NULL DEFAULT 'TARGET',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "lecipm_pipeline_deal_lenders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "lecipm_pipeline_deal_lender_offers" (
    "id" TEXT NOT NULL,
    "deal_id" VARCHAR(36) NOT NULL,
    "lender_id" VARCHAR(36) NOT NULL,
    "offered_amount" DOUBLE PRECISION NOT NULL,
    "interest_rate" DOUBLE PRECISION NOT NULL,
    "amortization_years" INTEGER,
    "term_years" INTEGER,
    "conditions_json" JSONB,
    "status" VARCHAR(24) NOT NULL DEFAULT 'RECEIVED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "lecipm_pipeline_deal_lender_offers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "lecipm_pipeline_deal_financing_conditions" (
    "id" TEXT NOT NULL,
    "deal_id" VARCHAR(36) NOT NULL,
    "lender_offer_id" VARCHAR(36),
    "title" VARCHAR(512) NOT NULL,
    "description" TEXT,
    "status" VARCHAR(16) NOT NULL DEFAULT 'OPEN',
    "is_critical" BOOLEAN NOT NULL DEFAULT true,
    "waiver_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "lecipm_pipeline_deal_financing_conditions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "lecipm_pipeline_deal_closing_readiness" (
    "id" TEXT NOT NULL,
    "deal_id" VARCHAR(36) NOT NULL,
    "readiness_status" VARCHAR(24) NOT NULL DEFAULT 'BLOCKED',
    "blocking_items_json" JSONB,
    "last_evaluated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "lecipm_pipeline_deal_closing_readiness_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "lecipm_pipeline_deal_closing_readiness_deal_id_key" ON "lecipm_pipeline_deal_closing_readiness"("deal_id");

ALTER TABLE "lecipm_pipeline_deal_capital_stacks"
  ADD CONSTRAINT "lecipm_pipeline_deal_capital_stacks_deal_id_fkey"
  FOREIGN KEY ("deal_id") REFERENCES "lecipm_pipeline_deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lecipm_pipeline_deal_lenders"
  ADD CONSTRAINT "lecipm_pipeline_deal_lenders_deal_id_fkey"
  FOREIGN KEY ("deal_id") REFERENCES "lecipm_pipeline_deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lecipm_pipeline_deal_lender_offers"
  ADD CONSTRAINT "lecipm_pipeline_deal_lender_offers_deal_id_fkey"
  FOREIGN KEY ("deal_id") REFERENCES "lecipm_pipeline_deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lecipm_pipeline_deal_lender_offers"
  ADD CONSTRAINT "lecipm_pipeline_deal_lender_offers_lender_id_fkey"
  FOREIGN KEY ("lender_id") REFERENCES "lecipm_pipeline_deal_lenders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lecipm_pipeline_deal_financing_conditions"
  ADD CONSTRAINT "lecipm_pipeline_deal_financing_conditions_deal_id_fkey"
  FOREIGN KEY ("deal_id") REFERENCES "lecipm_pipeline_deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lecipm_pipeline_deal_financing_conditions"
  ADD CONSTRAINT "lecipm_pipeline_deal_financing_conditions_lender_offer_id_fkey"
  FOREIGN KEY ("lender_offer_id") REFERENCES "lecipm_pipeline_deal_lender_offers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "lecipm_pipeline_deal_closing_readiness"
  ADD CONSTRAINT "lecipm_pipeline_deal_closing_readiness_deal_id_fkey"
  FOREIGN KEY ("deal_id") REFERENCES "lecipm_pipeline_deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "lecipm_pipeline_deal_lenders_deal_id_status_idx" ON "lecipm_pipeline_deal_lenders"("deal_id", "status");
CREATE INDEX "lecipm_pipeline_deal_lender_offers_deal_id_idx" ON "lecipm_pipeline_deal_lender_offers"("deal_id");
CREATE INDEX "lecipm_pipeline_deal_lender_offers_lender_id_idx" ON "lecipm_pipeline_deal_lender_offers"("lender_id");
CREATE INDEX "lecipm_pipeline_deal_financing_conditions_deal_id_status_idx" ON "lecipm_pipeline_deal_financing_conditions"("deal_id", "status");
