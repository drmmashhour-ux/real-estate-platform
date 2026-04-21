-- LECIPM portfolio intelligence + supervised asset manager (PostCloseAsset-scoped)

CREATE TABLE "portfolio_asset_health" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "overall_health_score" DOUBLE PRECISION,
    "health_band" VARCHAR(24),
    "revenue_health_score" DOUBLE PRECISION,
    "esg_health_score" DOUBLE PRECISION,
    "compliance_health_score" DOUBLE PRECISION,
    "financing_health_score" DOUBLE PRECISION,
    "operations_health_score" DOUBLE PRECISION,
    "confidence_level" VARCHAR(24),
    "blockers_json" JSONB,
    "opportunities_json" JSONB,
    "summary_text" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "portfolio_asset_health_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "portfolio_asset_health_asset_id_key" ON "portfolio_asset_health"("asset_id");

CREATE TABLE "portfolio_priorities" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "priority_type" VARCHAR(32) NOT NULL,
    "rank" INTEGER NOT NULL,
    "priority_score" DOUBLE PRECISION,
    "title" VARCHAR(512) NOT NULL,
    "explanation" TEXT NOT NULL,
    "action_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "portfolio_priorities_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "portfolio_priorities_asset_id_rank_idx" ON "portfolio_priorities"("asset_id", "rank");

CREATE TABLE "portfolio_capital_allocation_plans" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT,
    "version" VARCHAR(32) NOT NULL,
    "status" VARCHAR(24) NOT NULL DEFAULT 'DRAFT',
    "total_budget_band" VARCHAR(24),
    "allocation_json" JSONB NOT NULL,
    "rationale_json" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "portfolio_capital_allocation_plans_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "portfolio_capital_allocation_plans_owner_id_created_at_idx" ON "portfolio_capital_allocation_plans"("owner_id", "created_at" DESC);

CREATE TABLE "asset_manager_plans" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "version" VARCHAR(32) NOT NULL,
    "status" VARCHAR(24) NOT NULL DEFAULT 'DRAFT',
    "strategy_type" VARCHAR(48),
    "objective_mode" VARCHAR(32),
    "summary_text" TEXT,
    "plan_json" JSONB NOT NULL,
    "rationale_json" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "asset_manager_plans_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "asset_manager_plans_asset_id_created_at_idx" ON "asset_manager_plans"("asset_id", "created_at" DESC);

CREATE TABLE "asset_manager_actions" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "plan_id" TEXT,
    "title" VARCHAR(512) NOT NULL,
    "category" VARCHAR(32) NOT NULL,
    "priority" VARCHAR(16) NOT NULL,
    "status" VARCHAR(16) NOT NULL DEFAULT 'PENDING',
    "expected_impact_band" VARCHAR(24),
    "cost_band" VARCHAR(24),
    "timeline_band" VARCHAR(24),
    "owner_type" VARCHAR(24),
    "explanation" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "asset_manager_actions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "asset_manager_actions_asset_id_status_idx" ON "asset_manager_actions"("asset_id", "status");

CREATE TABLE "portfolio_outcome_events" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT,
    "portfolio_id" TEXT,
    "event_type" VARCHAR(48) NOT NULL,
    "outcome_category" VARCHAR(16),
    "before_json" JSONB,
    "after_json" JSONB,
    "delta_json" JSONB,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "portfolio_outcome_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "portfolio_outcome_events_asset_id_created_at_idx" ON "portfolio_outcome_events"("asset_id", "created_at" DESC);

CREATE TABLE "portfolio_policies" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT,
    "autonomy_mode" VARCHAR(24) NOT NULL DEFAULT 'SAFE_APPROVAL',
    "primary_objective" VARCHAR(24) NOT NULL DEFAULT 'BALANCED',
    "risk_tolerance" VARCHAR(16) NOT NULL DEFAULT 'MEDIUM',
    "capex_tolerance" VARCHAR(16) NOT NULL DEFAULT 'MEDIUM',
    "esg_priority_weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "revenue_priority_weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "compliance_priority_weight" DOUBLE PRECISION NOT NULL DEFAULT 1.2,
    "financing_priority_weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "learning_adjustments_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "portfolio_policies_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "portfolio_policies_owner_id_key" ON "portfolio_policies"("owner_id");

CREATE TABLE "lecipm_portfolio_optimization_runs" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT,
    "objective_mode" VARCHAR(32) NOT NULL,
    "summary_json" JSONB NOT NULL,
    "asset_strategies_json" JSONB,
    "allocation_proposal_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "lecipm_portfolio_optimization_runs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lecipm_portfolio_optimization_runs_owner_id_created_at_idx" ON "lecipm_portfolio_optimization_runs"("owner_id", "created_at" DESC);

ALTER TABLE "portfolio_asset_health" ADD CONSTRAINT "portfolio_asset_health_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "post_close_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "portfolio_priorities" ADD CONSTRAINT "portfolio_priorities_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "post_close_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "portfolio_capital_allocation_plans" ADD CONSTRAINT "portfolio_capital_allocation_plans_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "asset_manager_plans" ADD CONSTRAINT "asset_manager_plans_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "post_close_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "asset_manager_actions" ADD CONSTRAINT "asset_manager_actions_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "post_close_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "asset_manager_actions" ADD CONSTRAINT "asset_manager_actions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "asset_manager_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "portfolio_outcome_events" ADD CONSTRAINT "portfolio_outcome_events_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "post_close_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "portfolio_policies" ADD CONSTRAINT "portfolio_policies_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lecipm_portfolio_optimization_runs" ADD CONSTRAINT "lecipm_portfolio_optimization_runs_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
