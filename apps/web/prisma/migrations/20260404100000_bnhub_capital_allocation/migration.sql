-- BNHub portfolio capital allocation plans (deterministic recommendations; approval-gated execution).

ALTER TABLE "bnhub_listings" ADD COLUMN IF NOT EXISTS "improvement_budget_need" DOUBLE PRECISION;
ALTER TABLE "bnhub_listings" ADD COLUMN IF NOT EXISTS "marketing_budget_need" DOUBLE PRECISION;
ALTER TABLE "bnhub_listings" ADD COLUMN IF NOT EXISTS "operational_risk_score" DOUBLE PRECISION;
ALTER TABLE "bnhub_listings" ADD COLUMN IF NOT EXISTS "manual_capital_lock" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "capital_allocation_plans" (
    "id" TEXT NOT NULL,
    "scope_type" VARCHAR(24) NOT NULL,
    "scope_id" TEXT NOT NULL,
    "total_budget" DOUBLE PRECISION NOT NULL,
    "allocatable_budget" DOUBLE PRECISION NOT NULL,
    "reserve_budget" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" VARCHAR(24) NOT NULL DEFAULT 'draft',
    "period_label" VARCHAR(32),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "capital_allocation_plans_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "capital_allocation_plans_scope_type_scope_id_created_at_idx"
  ON "capital_allocation_plans"("scope_type", "scope_id", "created_at");

CREATE TABLE "capital_allocation_items" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "allocation_type" VARCHAR(24) NOT NULL,
    "allocated_amount" DOUBLE PRECISION NOT NULL,
    "recommended_amount" DOUBLE PRECISION NOT NULL,
    "priority_score" DOUBLE PRECISION NOT NULL,
    "expected_impact_score" DOUBLE PRECISION NOT NULL,
    "confidence_score" DOUBLE PRECISION NOT NULL,
    "rationale_json" JSONB,
    "metrics_json" JSONB,
    "status" VARCHAR(24) NOT NULL DEFAULT 'recommended',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "capital_allocation_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "capital_allocation_items_plan_id_listing_id_idx"
  ON "capital_allocation_items"("plan_id", "listing_id");

ALTER TABLE "capital_allocation_items"
  ADD CONSTRAINT "capital_allocation_items_plan_id_fkey"
  FOREIGN KEY ("plan_id") REFERENCES "capital_allocation_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "capital_allocation_logs" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT,
    "listing_id" TEXT,
    "event_type" VARCHAR(32) NOT NULL,
    "message" TEXT,
    "meta" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "capital_allocation_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "capital_allocation_logs_plan_id_created_at_idx"
  ON "capital_allocation_logs"("plan_id", "created_at");

ALTER TABLE "capital_allocation_logs"
  ADD CONSTRAINT "capital_allocation_logs_plan_id_fkey"
  FOREIGN KEY ("plan_id") REFERENCES "capital_allocation_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
