-- Corporate strategy: advisory decision-support (no auto-execution; not audited financials).

CREATE TYPE "CorporateStrategyRecCategory" AS ENUM ('HIRING', 'BUDGET', 'PRODUCT', 'OPERATIONS', 'EXPANSION');
CREATE TYPE "CorporateStrategyTriage" AS ENUM ('low', 'medium', 'high');
CREATE TYPE "CorporateStrategyRecStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

CREATE TABLE "corporate_strategy_snapshots" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "period_key" VARCHAR(64) NOT NULL,
    "summary_json" JSONB NOT NULL,
    "hiring_strategy_json" JSONB NOT NULL,
    "budget_strategy_json" JSONB NOT NULL,
    "roadmap_strategy_json" JSONB NOT NULL,
    "bottlenecks_json" JSONB NOT NULL,
    "risks_json" JSONB NOT NULL,
    CONSTRAINT "corporate_strategy_snapshots_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "corporate_strategy_snapshots_period_key_created_at_idx" ON "corporate_strategy_snapshots"("period_key", "created_at");

CREATE TABLE "strategic_recommendations" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "category" "CorporateStrategyRecCategory" NOT NULL,
    "priority" "CorporateStrategyTriage" NOT NULL,
    "recommendation_key" VARCHAR(128) NOT NULL,
    "rationale_json" JSONB NOT NULL,
    "expected_impact_json" JSONB NOT NULL,
    "confidence" "CorporateStrategyTriage" NOT NULL,
    "status" "CorporateStrategyRecStatus" NOT NULL DEFAULT 'ACTIVE',
    CONSTRAINT "strategic_recommendations_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "strategic_recommendations_status_category_created_at_idx" ON "strategic_recommendations"("status", "category", "created_at");
CREATE INDEX "strategic_recommendations_recommendation_key_idx" ON "strategic_recommendations"("recommendation_key");
