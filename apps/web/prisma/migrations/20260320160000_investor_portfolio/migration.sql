-- CreateTable
CREATE TABLE "investor_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "name" TEXT,
    "email" TEXT,
    "budget_cents" INTEGER,
    "down_payment_cents" INTEGER,
    "target_cities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "strategy" TEXT,
    "risk_tolerance" TEXT,
    "property_types" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "target_roi_percent" DOUBLE PRECISION,
    "target_cash_flow_cents" INTEGER,
    "time_horizon_years" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investor_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolio_scenarios" (
    "id" TEXT NOT NULL,
    "investor_profile_id" TEXT,
    "user_id" TEXT,
    "title" TEXT NOT NULL,
    "strategy" TEXT,
    "scenario_kind" TEXT,
    "total_budget_cents" INTEGER NOT NULL DEFAULT 0,
    "total_down_payment_cents" INTEGER NOT NULL DEFAULT 0,
    "projected_monthly_cash_flow_cents" INTEGER NOT NULL DEFAULT 0,
    "projected_annual_cash_flow_cents" INTEGER NOT NULL DEFAULT 0,
    "projected_average_roi_percent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "projected_average_cap_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "projected_risk_level" TEXT,
    "projected_diversification_score" DOUBLE PRECISION,
    "insights_json" JSONB,
    "share_token" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "portfolio_scenarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolio_scenario_items" (
    "id" TEXT NOT NULL,
    "scenario_id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "purchase_price_cents" INTEGER NOT NULL,
    "estimated_rent_cents" INTEGER,
    "projected_roi_percent" DOUBLE PRECISION,
    "projected_cap_rate" DOUBLE PRECISION,
    "projected_cash_flow_cents" INTEGER,
    "city" TEXT,
    "property_type" TEXT,
    "risk_level" TEXT,
    "market_trend" TEXT,
    "fit_score" DOUBLE PRECISION,
    "strength_summary" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portfolio_scenario_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investor_portfolio_alerts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "alert_type" TEXT NOT NULL,
    "city" TEXT,
    "target_roi_percent" DOUBLE PRECISION,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "investor_portfolio_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "investor_profiles_user_id_idx" ON "investor_profiles"("user_id");

-- CreateIndex
CREATE INDEX "portfolio_scenarios_user_id_idx" ON "portfolio_scenarios"("user_id");

-- CreateIndex
CREATE INDEX "portfolio_scenarios_investor_profile_id_idx" ON "portfolio_scenarios"("investor_profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "portfolio_scenarios_share_token_key" ON "portfolio_scenarios"("share_token");

-- CreateIndex
CREATE INDEX "portfolio_scenario_items_scenario_id_idx" ON "portfolio_scenario_items"("scenario_id");

-- CreateIndex
CREATE INDEX "portfolio_scenario_items_listing_id_idx" ON "portfolio_scenario_items"("listing_id");

-- CreateIndex
CREATE INDEX "investor_portfolio_alerts_user_id_idx" ON "investor_portfolio_alerts"("user_id");

-- AddForeignKey
ALTER TABLE "investor_profiles" ADD CONSTRAINT "investor_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_scenarios" ADD CONSTRAINT "portfolio_scenarios_investor_profile_id_fkey" FOREIGN KEY ("investor_profile_id") REFERENCES "investor_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_scenarios" ADD CONSTRAINT "portfolio_scenarios_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_scenario_items" ADD CONSTRAINT "portfolio_scenario_items_scenario_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "portfolio_scenarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investor_portfolio_alerts" ADD CONSTRAINT "investor_portfolio_alerts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
