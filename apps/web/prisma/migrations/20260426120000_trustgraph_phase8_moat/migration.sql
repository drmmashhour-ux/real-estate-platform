-- Phase 8 TrustGraph: billing, usage, partner API, recertification, rulesets, audit packages

CREATE TYPE "TrustgraphSubscriptionStatus" AS ENUM ('active', 'trial', 'paused', 'canceled');

CREATE TABLE "trustgraph_subscription_plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "features" JSONB,
    "pricing" JSONB,
    "limits" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "trustgraph_subscription_plans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "trustgraph_subscriptions" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "status" "TrustgraphSubscriptionStatus" NOT NULL DEFAULT 'trial',
    "current_period_start" TIMESTAMPTZ(6),
    "current_period_end" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "trustgraph_subscriptions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "idx_tg_subscription_workspace" ON "trustgraph_subscriptions"("workspace_id");
ALTER TABLE "trustgraph_subscriptions" ADD CONSTRAINT "trustgraph_subscriptions_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "trustgraph_compliance_workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "trustgraph_subscriptions" ADD CONSTRAINT "trustgraph_subscriptions_plan_id_fkey"
  FOREIGN KEY ("plan_id") REFERENCES "trustgraph_subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "trustgraph_usage_records" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT,
    "usage_type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "recorded_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    CONSTRAINT "trustgraph_usage_records_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "idx_tg_usage_ws_type" ON "trustgraph_usage_records"("workspace_id", "usage_type");
CREATE INDEX "idx_tg_usage_recorded" ON "trustgraph_usage_records"("recorded_at");

CREATE TABLE "trustgraph_billing_events" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT,
    "event_type" TEXT NOT NULL,
    "payload" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "trustgraph_billing_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "idx_tg_billing_ws" ON "trustgraph_billing_events"("workspace_id");

CREATE TABLE "trustgraph_partner_api_keys" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "key_hash" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT 'default',
    "rate_limit_per_minute" INTEGER NOT NULL DEFAULT 60,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMPTZ(6),
    CONSTRAINT "trustgraph_partner_api_keys_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "idx_tg_partner_key_hash" ON "trustgraph_partner_api_keys"("key_hash");
CREATE INDEX "idx_tg_partner_key_ws" ON "trustgraph_partner_api_keys"("workspace_id");
ALTER TABLE "trustgraph_partner_api_keys" ADD CONSTRAINT "trustgraph_partner_api_keys_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "trustgraph_compliance_workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "trustgraph_recertification_jobs" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT,
    "subject_type" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "next_run_at" TIMESTAMPTZ(6),
    "last_result" TEXT,
    "config" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "trustgraph_recertification_jobs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "idx_tg_recert_subject" ON "trustgraph_recertification_jobs"("subject_type", "subject_id");
CREATE INDEX "idx_tg_recert_next" ON "trustgraph_recertification_jobs"("next_run_at");

CREATE TABLE "trustgraph_recertification_rules" (
    "id" TEXT NOT NULL,
    "ruleset_key" TEXT NOT NULL,
    "subject_type" TEXT NOT NULL,
    "interval_days" INTEGER NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "trustgraph_recertification_rules_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "idx_tg_recert_rule_ruleset" ON "trustgraph_recertification_rules"("ruleset_key");

CREATE TABLE "trustgraph_recertification_events" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "trustgraph_recertification_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "idx_tg_recert_events_job" ON "trustgraph_recertification_events"("job_id");
ALTER TABLE "trustgraph_recertification_events" ADD CONSTRAINT "trustgraph_recertification_events_job_id_fkey"
  FOREIGN KEY ("job_id") REFERENCES "trustgraph_recertification_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "trustgraph_compliance_rulesets" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region_pattern" TEXT,
    "config" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "trustgraph_compliance_rulesets_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "trustgraph_compliance_rulesets_code_key" ON "trustgraph_compliance_rulesets"("code");

CREATE TABLE "trustgraph_audit_packages" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "package_hash" TEXT NOT NULL,
    "manifest" JSONB NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "trustgraph_audit_packages_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "idx_tg_audit_ws" ON "trustgraph_audit_packages"("workspace_id");
