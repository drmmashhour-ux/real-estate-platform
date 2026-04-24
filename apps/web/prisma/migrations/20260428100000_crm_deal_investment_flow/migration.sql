-- CRM deal investor commitment / subscription / payment / cap table (AMF-aligned workflow).

CREATE TABLE "crm_deal_investor_commitments" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "investor_id" TEXT NOT NULL,
    "spv_id" TEXT,
    "committed_amount_cents" INTEGER NOT NULL,
    "currency" VARCHAR(8) NOT NULL DEFAULT 'CAD',
    "status" VARCHAR(24) NOT NULL DEFAULT 'SOFT_COMMIT',
    "broker_approved_at" TIMESTAMP(3),
    "broker_approved_by_id" TEXT,
    "broker_rejected_at" TIMESTAMP(3),
    "broker_rejected_by_id" TEXT,
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_deal_investor_commitments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "crm_deal_investor_commitments_deal_id_status_idx" ON "crm_deal_investor_commitments"("deal_id", "status");
CREATE INDEX "crm_deal_investor_commitments_investor_id_idx" ON "crm_deal_investor_commitments"("investor_id");

ALTER TABLE "crm_deal_investor_commitments" ADD CONSTRAINT "crm_deal_investor_commitments_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "crm_deal_investor_commitments" ADD CONSTRAINT "crm_deal_investor_commitments_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "crm_deal_investor_commitments" ADD CONSTRAINT "crm_deal_investor_commitments_spv_id_fkey" FOREIGN KEY ("spv_id") REFERENCES "amf_spvs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "crm_deal_investor_commitments" ADD CONSTRAINT "crm_deal_investor_commitments_broker_approved_by_id_fkey" FOREIGN KEY ("broker_approved_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "crm_deal_investor_commitments" ADD CONSTRAINT "crm_deal_investor_commitments_broker_rejected_by_id_fkey" FOREIGN KEY ("broker_rejected_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "crm_deal_investor_subscriptions" (
    "id" TEXT NOT NULL,
    "commitment_id" TEXT NOT NULL,
    "investor_id" TEXT NOT NULL,
    "subscription_amount_cents" INTEGER NOT NULL,
    "signed" BOOLEAN NOT NULL DEFAULT false,
    "signed_at" TIMESTAMP(3),
    "document_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_deal_investor_subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "crm_deal_investor_subscriptions_commitment_id_key" ON "crm_deal_investor_subscriptions"("commitment_id");
CREATE INDEX "crm_deal_investor_subscriptions_investor_id_idx" ON "crm_deal_investor_subscriptions"("investor_id");

ALTER TABLE "crm_deal_investor_subscriptions" ADD CONSTRAINT "crm_deal_investor_subscriptions_commitment_id_fkey" FOREIGN KEY ("commitment_id") REFERENCES "crm_deal_investor_commitments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "crm_deal_investor_subscriptions" ADD CONSTRAINT "crm_deal_investor_subscriptions_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "crm_deal_investor_subscriptions" ADD CONSTRAINT "crm_deal_investor_subscriptions_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "deal_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "crm_deal_investor_payments" (
    "id" TEXT NOT NULL,
    "subscription_id" TEXT NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "method" VARCHAR(16) NOT NULL,
    "received" BOOLEAN NOT NULL DEFAULT false,
    "received_at" TIMESTAMP(3),
    "reference_number" VARCHAR(128),
    "recorded_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_deal_investor_payments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "crm_deal_investor_payments_subscription_id_idx" ON "crm_deal_investor_payments"("subscription_id");

ALTER TABLE "crm_deal_investor_payments" ADD CONSTRAINT "crm_deal_investor_payments_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "crm_deal_investor_subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "crm_deal_investor_payments" ADD CONSTRAINT "crm_deal_investor_payments_recorded_by_user_id_fkey" FOREIGN KEY ("recorded_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "crm_deal_cap_table_entries" (
    "id" TEXT NOT NULL,
    "spv_id" TEXT NOT NULL,
    "investor_id" TEXT NOT NULL,
    "invested_amount_cents" INTEGER NOT NULL,
    "ownership_percent" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_deal_cap_table_entries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "crm_deal_cap_table_entries_spv_id_investor_id_key" ON "crm_deal_cap_table_entries"("spv_id", "investor_id");
CREATE INDEX "crm_deal_cap_table_entries_spv_id_idx" ON "crm_deal_cap_table_entries"("spv_id");

ALTER TABLE "crm_deal_cap_table_entries" ADD CONSTRAINT "crm_deal_cap_table_entries_spv_id_fkey" FOREIGN KEY ("spv_id") REFERENCES "amf_spvs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "crm_deal_cap_table_entries" ADD CONSTRAINT "crm_deal_cap_table_entries_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "lecipm_investment_flow_audit_logs" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "actor_user_id" TEXT,
    "action" VARCHAR(64) NOT NULL,
    "entity_type" VARCHAR(64),
    "entity_id" VARCHAR(64),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "diff" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lecipm_investment_flow_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lecipm_investment_flow_audit_logs_deal_id_created_at_idx" ON "lecipm_investment_flow_audit_logs"("deal_id", "created_at");
CREATE INDEX "lecipm_investment_flow_audit_logs_action_idx" ON "lecipm_investment_flow_audit_logs"("action");

ALTER TABLE "lecipm_investment_flow_audit_logs" ADD CONSTRAINT "lecipm_investment_flow_audit_logs_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lecipm_investment_flow_audit_logs" ADD CONSTRAINT "lecipm_investment_flow_audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
