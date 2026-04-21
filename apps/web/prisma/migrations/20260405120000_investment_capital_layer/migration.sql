-- Capital stack, lender workflow, offers, financing conditions, covenants, closing checklist, capital audit.

CREATE TABLE "investment_pipeline_capital_stacks" (
    "id" TEXT NOT NULL,
    "pipeline_deal_id" TEXT NOT NULL,
    "total_capital_required" DOUBLE PRECISION,
    "senior_debt_target" DOUBLE PRECISION,
    "mezzanine_target" DOUBLE PRECISION,
    "preferred_equity_target" DOUBLE PRECISION,
    "common_equity_target" DOUBLE PRECISION,
    "strategy_type" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "assumptions_json" JSONB,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investment_pipeline_capital_stacks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "investment_pipeline_capital_stacks_pipeline_deal_id_key" ON "investment_pipeline_capital_stacks"("pipeline_deal_id");

CREATE TABLE "investment_pipeline_lender_packages" (
    "id" TEXT NOT NULL,
    "pipeline_deal_id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'GENERATED',
    "title" TEXT NOT NULL,
    "payload_json" JSONB NOT NULL,
    "pdf_path" TEXT,
    "created_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investment_pipeline_lender_packages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "investment_pipeline_lenders" (
    "id" TEXT NOT NULL,
    "pipeline_deal_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lender_type" TEXT,
    "contact_name" TEXT,
    "contact_email" TEXT,
    "status" TEXT NOT NULL DEFAULT 'TARGET',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investment_pipeline_lenders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "investment_pipeline_financing_offers" (
    "id" TEXT NOT NULL,
    "pipeline_deal_id" TEXT NOT NULL,
    "lender_id" TEXT,
    "offer_name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "principal_amount" DOUBLE PRECISION,
    "interest_type" TEXT,
    "interest_rate_text" TEXT,
    "amortization_text" TEXT,
    "term_text" TEXT,
    "fees_text" TEXT,
    "recourse_type" TEXT,
    "covenant_summary" TEXT,
    "strengths_json" JSONB,
    "risks_json" JSONB,
    "assumptions_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investment_pipeline_financing_offers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "investment_pipeline_financing_conditions" (
    "id" TEXT NOT NULL,
    "pipeline_deal_id" TEXT NOT NULL,
    "offer_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "priority" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "due_date" TIMESTAMP(3),
    "owner_user_id" TEXT,
    "notes" TEXT,
    "waiver_note" TEXT,
    "waived_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "satisfied_at" TIMESTAMP(3),

    CONSTRAINT "investment_pipeline_financing_conditions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "investment_pipeline_covenants" (
    "id" TEXT NOT NULL,
    "pipeline_deal_id" TEXT NOT NULL,
    "offer_id" TEXT,
    "title" TEXT NOT NULL,
    "covenant_type" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "frequency" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investment_pipeline_covenants_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "investment_pipeline_closing_checklist_items" (
    "id" TEXT NOT NULL,
    "pipeline_deal_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "priority" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "owner_user_id" TEXT,
    "due_date" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investment_pipeline_closing_checklist_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "investment_pipeline_capital_audits" (
    "id" TEXT NOT NULL,
    "pipeline_deal_id" TEXT NOT NULL,
    "actor_user_id" TEXT,
    "event_type" TEXT NOT NULL,
    "note" TEXT,
    "metadata_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "investment_pipeline_capital_audits_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "investment_pipeline_lender_packages_pipeline_deal_id_created_at_idx" ON "investment_pipeline_lender_packages"("pipeline_deal_id", "created_at" DESC);

CREATE INDEX "investment_pipeline_lenders_pipeline_deal_id_idx" ON "investment_pipeline_lenders"("pipeline_deal_id");

CREATE INDEX "investment_pipeline_financing_offers_pipeline_deal_id_idx" ON "investment_pipeline_financing_offers"("pipeline_deal_id");

CREATE INDEX "investment_pipeline_financing_offers_lender_id_idx" ON "investment_pipeline_financing_offers"("lender_id");

CREATE INDEX "investment_pipeline_financing_conditions_pipeline_deal_id_status_idx" ON "investment_pipeline_financing_conditions"("pipeline_deal_id", "status");

CREATE INDEX "investment_pipeline_covenants_pipeline_deal_id_idx" ON "investment_pipeline_covenants"("pipeline_deal_id");

CREATE INDEX "investment_pipeline_closing_checklist_items_pipeline_deal_id_status_idx" ON "investment_pipeline_closing_checklist_items"("pipeline_deal_id", "status");

CREATE INDEX "investment_pipeline_capital_audits_pipeline_deal_id_created_at_idx" ON "investment_pipeline_capital_audits"("pipeline_deal_id", "created_at" DESC);

ALTER TABLE "investment_pipeline_capital_stacks" ADD CONSTRAINT "investment_pipeline_capital_stacks_pipeline_deal_id_fkey" FOREIGN KEY ("pipeline_deal_id") REFERENCES "investment_pipeline_deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "investment_pipeline_lender_packages" ADD CONSTRAINT "investment_pipeline_lender_packages_pipeline_deal_id_fkey" FOREIGN KEY ("pipeline_deal_id") REFERENCES "investment_pipeline_deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "investment_pipeline_lender_packages" ADD CONSTRAINT "investment_pipeline_lender_packages_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "investment_pipeline_lenders" ADD CONSTRAINT "investment_pipeline_lenders_pipeline_deal_id_fkey" FOREIGN KEY ("pipeline_deal_id") REFERENCES "investment_pipeline_deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "investment_pipeline_financing_offers" ADD CONSTRAINT "investment_pipeline_financing_offers_pipeline_deal_id_fkey" FOREIGN KEY ("pipeline_deal_id") REFERENCES "investment_pipeline_deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "investment_pipeline_financing_offers" ADD CONSTRAINT "investment_pipeline_financing_offers_lender_id_fkey" FOREIGN KEY ("lender_id") REFERENCES "investment_pipeline_lenders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "investment_pipeline_financing_conditions" ADD CONSTRAINT "investment_pipeline_financing_conditions_pipeline_deal_id_fkey" FOREIGN KEY ("pipeline_deal_id") REFERENCES "investment_pipeline_deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "investment_pipeline_financing_conditions" ADD CONSTRAINT "investment_pipeline_financing_conditions_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "investment_pipeline_financing_offers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "investment_pipeline_financing_conditions" ADD CONSTRAINT "investment_pipeline_financing_conditions_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "investment_pipeline_financing_conditions" ADD CONSTRAINT "investment_pipeline_financing_conditions_waived_by_user_id_fkey" FOREIGN KEY ("waived_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "investment_pipeline_covenants" ADD CONSTRAINT "investment_pipeline_covenants_pipeline_deal_id_fkey" FOREIGN KEY ("pipeline_deal_id") REFERENCES "investment_pipeline_deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "investment_pipeline_covenants" ADD CONSTRAINT "investment_pipeline_covenants_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "investment_pipeline_financing_offers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "investment_pipeline_closing_checklist_items" ADD CONSTRAINT "investment_pipeline_closing_checklist_items_pipeline_deal_id_fkey" FOREIGN KEY ("pipeline_deal_id") REFERENCES "investment_pipeline_deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "investment_pipeline_closing_checklist_items" ADD CONSTRAINT "investment_pipeline_closing_checklist_items_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "investment_pipeline_capital_audits" ADD CONSTRAINT "investment_pipeline_capital_audits_pipeline_deal_id_fkey" FOREIGN KEY ("pipeline_deal_id") REFERENCES "investment_pipeline_deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "investment_pipeline_capital_audits" ADD CONSTRAINT "investment_pipeline_capital_audits_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
