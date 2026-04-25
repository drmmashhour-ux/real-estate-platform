-- Investor / board intelligence: operational signals (not audited financials).

CREATE TYPE "CapitalAllocationScopeType" AS ENUM ('SEGMENT', 'CHANNEL', 'BROKER', 'MARKET', 'PRODUCT');
CREATE TYPE "CapitalRecommendationType" AS ENUM ('INCREASE', 'MAINTAIN', 'REDUCE', 'EXPERIMENT');
CREATE TYPE "CapitalAllocationConfidence" AS ENUM ('low', 'medium', 'high');
CREATE TYPE "CapitalAllocationStatus" AS ENUM ('ACTIVE', 'ARCHIVED');
CREATE TYPE "RoiScopeType" AS ENUM ('SEGMENT', 'CHANNEL', 'BROKER', 'MARKET', 'PRODUCT', 'STRATEGY');
CREATE TYPE "ExpansionScenarioStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

CREATE TABLE "investor_snapshots" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "period_key" VARCHAR(32) NOT NULL,
    "total_revenue" DOUBLE PRECISION NOT NULL,
    "total_won_deals" INTEGER NOT NULL,
    "total_lead_spend" DOUBLE PRECISION,
    "estimated_pipeline_value" DOUBLE PRECISION,
    "avg_deal_cycle_days" DOUBLE PRECISION,
    "top_segment_json" JSONB NOT NULL,
    "weak_segment_json" JSONB NOT NULL,
    "capital_allocation_json" JSONB NOT NULL,
    "risk_summary_json" JSONB NOT NULL,
    CONSTRAINT "investor_snapshots_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "investor_snapshots_period_key_created_at_idx" ON "investor_snapshots"("period_key", "created_at");

CREATE TABLE "capital_allocation_recommendations" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "recommendation_key" VARCHAR(128) NOT NULL,
    "scope_type" "CapitalAllocationScopeType" NOT NULL,
    "scope_key" VARCHAR(256) NOT NULL,
    "recommendation_type" "CapitalRecommendationType" NOT NULL,
    "confidence" "CapitalAllocationConfidence" NOT NULL,
    "rationale_json" JSONB NOT NULL,
    "expected_impact_json" JSONB NOT NULL,
    "status" "CapitalAllocationStatus" NOT NULL DEFAULT 'ACTIVE',
    CONSTRAINT "capital_allocation_recommendations_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "capital_allocation_recommendations_status_created_at_idx" ON "capital_allocation_recommendations"("status", "created_at");
CREATE INDEX "capital_allocation_recommendations_scope_type_scope_key_idx" ON "capital_allocation_recommendations"("scope_type", "scope_key");

CREATE TABLE "roi_performance_aggregates" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "scope_type" "RoiScopeType" NOT NULL,
    "scope_key" VARCHAR(256) NOT NULL,
    "revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "won_deals" INTEGER NOT NULL DEFAULT 0,
    "lost_deals" INTEGER NOT NULL DEFAULT 0,
    "avg_deal_cycle_days" DOUBLE PRECISION,
    "estimated_lead_spend" DOUBLE PRECISION,
    "roi_score" DOUBLE PRECISION,
    "efficiency_score" DOUBLE PRECISION,
    CONSTRAINT "roi_performance_aggregates_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "roi_performance_scope_key_unique" ON "roi_performance_aggregates"("scope_type", "scope_key");
CREATE INDEX "roi_performance_aggregates_scope_type_scope_key_idx" ON "roi_performance_aggregates"("scope_type", "scope_key");
CREATE INDEX "roi_performance_aggregates_roi_score_idx" ON "roi_performance_aggregates"("roi_score");

CREATE TABLE "expansion_scenarios" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "scenario_key" VARCHAR(128) NOT NULL,
    "market_key" VARCHAR(256) NOT NULL,
    "segment_key" VARCHAR(256),
    "assumptions_json" JSONB NOT NULL,
    "projected_impact_json" JSONB NOT NULL,
    "risk_json" JSONB NOT NULL,
    "created_by_user_id" TEXT,
    "status" "ExpansionScenarioStatus" NOT NULL DEFAULT 'DRAFT',
    CONSTRAINT "expansion_scenarios_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "expansion_scenarios_status_market_key_idx" ON "expansion_scenarios"("status", "market_key");
CREATE INDEX "expansion_scenarios_created_by_user_id_idx" ON "expansion_scenarios"("created_by_user_id");
ALTER TABLE "expansion_scenarios" ADD CONSTRAINT "expansion_scenarios_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
