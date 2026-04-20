-- AlterTable bnhub_listings — optional underwriting fields for deterministic investment overlay
ALTER TABLE "bnhub_listings" ADD COLUMN IF NOT EXISTS "investment_purchase_price_major" DOUBLE PRECISION;
ALTER TABLE "bnhub_listings" ADD COLUMN IF NOT EXISTS "investment_estimated_value_major" DOUBLE PRECISION;
ALTER TABLE "bnhub_listings" ADD COLUMN IF NOT EXISTS "investment_operating_cost_monthly_major" DOUBLE PRECISION;
ALTER TABLE "bnhub_listings" ADD COLUMN IF NOT EXISTS "investment_analytics_active" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "investment_recommendations" (
    "id" TEXT NOT NULL,
    "scope_type" VARCHAR(24) NOT NULL,
    "scope_id" TEXT NOT NULL,
    "recommendation" VARCHAR(24) NOT NULL,
    "confidence_score" DOUBLE PRECISION NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "reasons_json" JSONB,
    "risks_json" JSONB,
    "actions_json" JSONB,
    "metrics_json" JSONB,
    "status" VARCHAR(24) NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investment_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investment_recommendation_logs" (
    "id" TEXT NOT NULL,
    "recommendation_id" TEXT NOT NULL,
    "action_type" VARCHAR(24) NOT NULL,
    "message" TEXT,
    "meta" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "investment_recommendation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "investment_recommendations_scope_type_scope_id_created_at_idx" ON "investment_recommendations"("scope_type", "scope_id", "created_at");

-- CreateIndex
CREATE INDEX "investment_recommendation_logs_recommendation_id_created_at_idx" ON "investment_recommendation_logs"("recommendation_id", "created_at");

-- AddForeignKey
ALTER TABLE "investment_recommendation_logs" ADD CONSTRAINT "investment_recommendation_logs_recommendation_id_fkey" FOREIGN KEY ("recommendation_id") REFERENCES "investment_recommendations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
