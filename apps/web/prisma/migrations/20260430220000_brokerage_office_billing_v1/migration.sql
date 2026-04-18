-- Multi-broker office management + brokerage commission/billing/payout v1 (Québec ops; not legal/accounting finality).

CREATE TYPE "OfficeMembershipStatus" AS ENUM ('invited', 'active', 'suspended', 'left');

CREATE TYPE "OfficeMembershipRole" AS ENUM (
  'office_owner',
  'office_admin',
  'managing_broker',
  'broker',
  'broker_assistant',
  'coordinator',
  'finance_admin',
  'reviewer'
);

CREATE TYPE "BrokerageCommissionPlanStatus" AS ENUM ('draft', 'active', 'archived');

CREATE TYPE "BrokerageCommissionCaseStatus" AS ENUM (
  'draft',
  'calculated',
  'pending_review',
  'approved',
  'invoiced',
  'payout_ready',
  'paid',
  'disputed',
  'archived'
);

CREATE TYPE "BrokerageCommissionSplitCategory" AS ENUM (
  'office_share',
  'broker_share',
  'team_share',
  'referral_share',
  'external_broker',
  'deduction',
  'fee'
);

CREATE TYPE "BrokerageSplitPayeeKind" AS ENUM ('office', 'broker', 'team', 'external', 'platform');

CREATE TYPE "OfficeInvoiceStatus" AS ENUM ('draft', 'issued', 'due', 'paid', 'overdue', 'cancelled', 'disputed');

CREATE TYPE "OfficeInvoiceType" AS ENUM (
  'office_fee',
  'transaction_admin',
  'marketing',
  'software_platform',
  'compliance_review',
  'referral',
  'external_brokerage',
  'commission_record',
  'other'
);

CREATE TYPE "OfficeInvoiceLineType" AS ENUM ('line_item', 'adjustment', 'tax');

CREATE TYPE "OfficePayoutStatus" AS ENUM ('draft', 'ready', 'approved', 'sent', 'paid', 'failed', 'reversed');

CREATE TYPE "OfficePayoutLineSourceType" AS ENUM ('commission_case', 'invoice_adjustment', 'manual');

CREATE TYPE "OfficeReconciliationRecordType" AS ENUM ('commission', 'invoice', 'payout', 'deal');

CREATE TYPE "OfficeReconciliationStatus" AS ENUM ('open', 'matched', 'discrepancy', 'resolved');

-- Alter deals (nullable office scope)
ALTER TABLE "deals" ADD COLUMN "brokerage_office_id" TEXT;

CREATE TABLE "brokerage_offices" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "legal_name" VARCHAR(300),
    "office_code" VARCHAR(32),
    "region" VARCHAR(64),
    "address" TEXT,
    "phone" VARCHAR(64),
    "email" VARCHAR(200),
    "owner_user_id" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brokerage_offices_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "brokerage_offices_office_code_key" ON "brokerage_offices"("office_code");

CREATE TABLE "brokerage_office_settings" (
    "id" TEXT NOT NULL,
    "office_id" TEXT NOT NULL,
    "default_currency" VARCHAR(8) NOT NULL DEFAULT 'CAD',
    "tax_config" JSONB NOT NULL DEFAULT '{}',
    "commission_config" JSONB NOT NULL DEFAULT '{}',
    "payout_config" JSONB NOT NULL DEFAULT '{}',
    "billing_config" JSONB NOT NULL DEFAULT '{}',
    "feature_config" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brokerage_office_settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "brokerage_office_settings_office_id_key" ON "brokerage_office_settings"("office_id");

CREATE TABLE "office_memberships" (
    "id" TEXT NOT NULL,
    "office_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "membership_status" "OfficeMembershipStatus" NOT NULL DEFAULT 'invited',
    "role" "OfficeMembershipRole" NOT NULL,
    "start_date" DATE,
    "end_date" DATE,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "office_memberships_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "office_memberships_office_id_user_id_key" ON "office_memberships"("office_id", "user_id");
CREATE INDEX "office_memberships_user_id_idx" ON "office_memberships"("user_id");
CREATE INDEX "office_memberships_office_id_membership_status_idx" ON "office_memberships"("office_id", "membership_status");

CREATE TABLE "office_teams" (
    "id" TEXT NOT NULL,
    "office_id" TEXT NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "lead_user_id" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "office_teams_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "office_teams_office_id_idx" ON "office_teams"("office_id");
CREATE INDEX "office_teams_lead_user_id_idx" ON "office_teams"("lead_user_id");

CREATE TABLE "office_team_memberships" (
    "id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "team_role" VARCHAR(32) NOT NULL DEFAULT 'member',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "office_team_memberships_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "office_team_memberships_team_id_user_id_key" ON "office_team_memberships"("team_id", "user_id");
CREATE INDEX "office_team_memberships_user_id_idx" ON "office_team_memberships"("user_id");

CREATE TABLE "brokerage_commission_plans" (
    "id" TEXT NOT NULL,
    "office_id" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "status" "BrokerageCommissionPlanStatus" NOT NULL DEFAULT 'draft',
    "rule_config" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brokerage_commission_plans_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "brokerage_commission_plans_office_id_status_idx" ON "brokerage_commission_plans"("office_id", "status");

CREATE TABLE "broker_commission_assignments" (
    "id" TEXT NOT NULL,
    "office_id" TEXT NOT NULL,
    "broker_user_id" TEXT NOT NULL,
    "commission_plan_id" TEXT NOT NULL,
    "effective_from" DATE NOT NULL,
    "effective_to" DATE,
    "override_config" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "broker_commission_assignments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "broker_commission_assignments_office_id_broker_user_id_idx" ON "broker_commission_assignments"("office_id", "broker_user_id");
CREATE INDEX "broker_commission_assignments_commission_plan_id_idx" ON "broker_commission_assignments"("commission_plan_id");

CREATE TABLE "brokerage_commission_cases" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "office_id" TEXT NOT NULL,
    "broker_user_id" TEXT NOT NULL,
    "gross_commission_cents" INTEGER NOT NULL,
    "status" "BrokerageCommissionCaseStatus" NOT NULL DEFAULT 'draft',
    "source_data" JSONB NOT NULL DEFAULT '{}',
    "calculated_breakdown" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brokerage_commission_cases_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "brokerage_commission_cases_deal_id_idx" ON "brokerage_commission_cases"("deal_id");
CREATE INDEX "brokerage_commission_cases_office_id_status_idx" ON "brokerage_commission_cases"("office_id", "status");
CREATE INDEX "brokerage_commission_cases_broker_user_id_idx" ON "brokerage_commission_cases"("broker_user_id");

CREATE TABLE "brokerage_commission_split_lines" (
    "id" TEXT NOT NULL,
    "commission_case_id" TEXT NOT NULL,
    "split_category" "BrokerageCommissionSplitCategory" NOT NULL,
    "payee_kind" "BrokerageSplitPayeeKind" NOT NULL,
    "payee_user_id" TEXT,
    "payee_external_name" VARCHAR(200),
    "amount_cents" INTEGER NOT NULL,
    "percentage" DOUBLE PRECISION,
    "notes" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "brokerage_commission_split_lines_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "brokerage_commission_split_lines_commission_case_id_idx" ON "brokerage_commission_split_lines"("commission_case_id");
CREATE INDEX "brokerage_commission_split_lines_payee_user_id_idx" ON "brokerage_commission_split_lines"("payee_user_id");

CREATE TABLE "office_invoices" (
    "id" TEXT NOT NULL,
    "office_id" TEXT NOT NULL,
    "broker_user_id" TEXT,
    "deal_id" TEXT,
    "invoice_type" "OfficeInvoiceType" NOT NULL,
    "status" "OfficeInvoiceStatus" NOT NULL DEFAULT 'draft',
    "subtotal_cents" INTEGER NOT NULL,
    "taxes" JSONB DEFAULT '{}',
    "total_cents" INTEGER NOT NULL,
    "issued_at" TIMESTAMP(3),
    "due_at" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "issued_by_user_id" TEXT,
    "marked_paid_by_user_id" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "office_invoices_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "office_invoices_office_id_status_idx" ON "office_invoices"("office_id", "status");
CREATE INDEX "office_invoices_broker_user_id_idx" ON "office_invoices"("broker_user_id");
CREATE INDEX "office_invoices_deal_id_idx" ON "office_invoices"("deal_id");

CREATE TABLE "office_invoice_lines" (
    "id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "line_type" "OfficeInvoiceLineType" NOT NULL,
    "description" VARCHAR(500) NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "unit_amount_cents" INTEGER NOT NULL,
    "total_amount_cents" INTEGER NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "office_invoice_lines_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "office_invoice_lines_invoice_id_idx" ON "office_invoice_lines"("invoice_id");

CREATE TABLE "office_payouts" (
    "id" TEXT NOT NULL,
    "office_id" TEXT NOT NULL,
    "broker_user_id" TEXT NOT NULL,
    "status" "OfficePayoutStatus" NOT NULL DEFAULT 'draft',
    "amount_cents" INTEGER NOT NULL,
    "period_start" DATE,
    "period_end" DATE,
    "payout_method" VARCHAR(64),
    "external_reference" VARCHAR(200),
    "approved_at" TIMESTAMP(3),
    "approved_by_user_id" TEXT,
    "paid_at" TIMESTAMP(3),
    "paid_recorded_by_user_id" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "office_payouts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "office_payouts_office_id_status_idx" ON "office_payouts"("office_id", "status");
CREATE INDEX "office_payouts_broker_user_id_idx" ON "office_payouts"("broker_user_id");

CREATE TABLE "office_payout_lines" (
    "id" TEXT NOT NULL,
    "payout_id" TEXT NOT NULL,
    "source_type" "OfficePayoutLineSourceType" NOT NULL,
    "source_id" VARCHAR(64) NOT NULL,
    "description" VARCHAR(500) NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "office_payout_lines_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "office_payout_lines_payout_id_idx" ON "office_payout_lines"("payout_id");

CREATE TABLE "office_reconciliation_records" (
    "id" TEXT NOT NULL,
    "office_id" TEXT NOT NULL,
    "record_type" "OfficeReconciliationRecordType" NOT NULL,
    "source_type" VARCHAR(64) NOT NULL,
    "source_id" VARCHAR(64) NOT NULL,
    "status" "OfficeReconciliationStatus" NOT NULL DEFAULT 'open',
    "notes" JSONB NOT NULL DEFAULT '{}',
    "created_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "office_reconciliation_records_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "office_reconciliation_records_office_id_status_idx" ON "office_reconciliation_records"("office_id", "status");
CREATE INDEX "office_reconciliation_records_source_type_source_id_idx" ON "office_reconciliation_records"("source_type", "source_id");

CREATE TABLE "brokerage_office_audit_logs" (
    "id" TEXT NOT NULL,
    "office_id" TEXT NOT NULL,
    "actor_user_id" TEXT NOT NULL,
    "action_key" VARCHAR(96) NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "brokerage_office_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "brokerage_office_audit_logs_office_id_created_at_idx" ON "brokerage_office_audit_logs"("office_id", "created_at");
CREATE INDEX "brokerage_office_audit_logs_action_key_idx" ON "brokerage_office_audit_logs"("action_key");

-- Foreign keys
ALTER TABLE "brokerage_offices" ADD CONSTRAINT "brokerage_offices_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "brokerage_office_settings" ADD CONSTRAINT "brokerage_office_settings_office_id_fkey" FOREIGN KEY ("office_id") REFERENCES "brokerage_offices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "office_memberships" ADD CONSTRAINT "office_memberships_office_id_fkey" FOREIGN KEY ("office_id") REFERENCES "brokerage_offices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "office_memberships" ADD CONSTRAINT "office_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "office_teams" ADD CONSTRAINT "office_teams_office_id_fkey" FOREIGN KEY ("office_id") REFERENCES "brokerage_offices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "office_teams" ADD CONSTRAINT "office_teams_lead_user_id_fkey" FOREIGN KEY ("lead_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "office_team_memberships" ADD CONSTRAINT "office_team_memberships_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "office_teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "office_team_memberships" ADD CONSTRAINT "office_team_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "brokerage_commission_plans" ADD CONSTRAINT "brokerage_commission_plans_office_id_fkey" FOREIGN KEY ("office_id") REFERENCES "brokerage_offices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "broker_commission_assignments" ADD CONSTRAINT "broker_commission_assignments_office_id_fkey" FOREIGN KEY ("office_id") REFERENCES "brokerage_offices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "broker_commission_assignments" ADD CONSTRAINT "broker_commission_assignments_broker_user_id_fkey" FOREIGN KEY ("broker_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "broker_commission_assignments" ADD CONSTRAINT "broker_commission_assignments_commission_plan_id_fkey" FOREIGN KEY ("commission_plan_id") REFERENCES "brokerage_commission_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "brokerage_commission_cases" ADD CONSTRAINT "brokerage_commission_cases_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "brokerage_commission_cases" ADD CONSTRAINT "brokerage_commission_cases_office_id_fkey" FOREIGN KEY ("office_id") REFERENCES "brokerage_offices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "brokerage_commission_cases" ADD CONSTRAINT "brokerage_commission_cases_broker_user_id_fkey" FOREIGN KEY ("broker_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "brokerage_commission_split_lines" ADD CONSTRAINT "brokerage_commission_split_lines_commission_case_id_fkey" FOREIGN KEY ("commission_case_id") REFERENCES "brokerage_commission_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "brokerage_commission_split_lines" ADD CONSTRAINT "brokerage_commission_split_lines_payee_user_id_fkey" FOREIGN KEY ("payee_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "office_invoices" ADD CONSTRAINT "office_invoices_office_id_fkey" FOREIGN KEY ("office_id") REFERENCES "brokerage_offices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "office_invoices" ADD CONSTRAINT "office_invoices_broker_user_id_fkey" FOREIGN KEY ("broker_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "office_invoices" ADD CONSTRAINT "office_invoices_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "office_invoices" ADD CONSTRAINT "office_invoices_issued_by_user_id_fkey" FOREIGN KEY ("issued_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "office_invoices" ADD CONSTRAINT "office_invoices_marked_paid_by_user_id_fkey" FOREIGN KEY ("marked_paid_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "office_invoice_lines" ADD CONSTRAINT "office_invoice_lines_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "office_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "office_payouts" ADD CONSTRAINT "office_payouts_office_id_fkey" FOREIGN KEY ("office_id") REFERENCES "brokerage_offices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "office_payouts" ADD CONSTRAINT "office_payouts_broker_user_id_fkey" FOREIGN KEY ("broker_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "office_payouts" ADD CONSTRAINT "office_payouts_approved_by_user_id_fkey" FOREIGN KEY ("approved_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "office_payouts" ADD CONSTRAINT "office_payouts_paid_recorded_by_user_id_fkey" FOREIGN KEY ("paid_recorded_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "office_payout_lines" ADD CONSTRAINT "office_payout_lines_payout_id_fkey" FOREIGN KEY ("payout_id") REFERENCES "office_payouts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "office_reconciliation_records" ADD CONSTRAINT "office_reconciliation_records_office_id_fkey" FOREIGN KEY ("office_id") REFERENCES "brokerage_offices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "office_reconciliation_records" ADD CONSTRAINT "office_reconciliation_records_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "brokerage_office_audit_logs" ADD CONSTRAINT "brokerage_office_audit_logs_office_id_fkey" FOREIGN KEY ("office_id") REFERENCES "brokerage_offices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "brokerage_office_audit_logs" ADD CONSTRAINT "brokerage_office_audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "deals" ADD CONSTRAINT "deals_brokerage_office_id_fkey" FOREIGN KEY ("brokerage_office_id") REFERENCES "brokerage_offices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "deals_brokerage_office_id_idx" ON "deals"("brokerage_office_id");
