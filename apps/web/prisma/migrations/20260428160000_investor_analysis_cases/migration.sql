-- Investor analysis cases + scenarios (underwriting calculator; advisory only).

CREATE TABLE IF NOT EXISTS "investor_analysis_cases" (
    "id" TEXT NOT NULL,
    "owner_type" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "city" TEXT,
    "property_type" TEXT,
    "purchase_price_cents" INTEGER,
    "down_payment_cents" INTEGER,
    "loan_amount_cents" INTEGER,
    "annual_interest_rate" DOUBLE PRECISION,
    "amortization_years" INTEGER,
    "monthly_mortgage_cents" INTEGER,
    "monthly_rent_cents" INTEGER,
    "other_monthly_income_cents" INTEGER,
    "monthly_taxes_cents" INTEGER,
    "monthly_insurance_cents" INTEGER,
    "monthly_utilities_cents" INTEGER,
    "monthly_maintenance_cents" INTEGER,
    "monthly_management_cents" INTEGER,
    "monthly_vacancy_cents" INTEGER,
    "monthly_other_expenses_cents" INTEGER,
    "annual_cashflow_cents" INTEGER,
    "monthly_cashflow_cents" INTEGER,
    "cap_rate" DOUBLE PRECISION,
    "gross_rent_multiplier" DOUBLE PRECISION,
    "cash_on_cash_return" DOUBLE PRECISION,
    "roi_percent" DOUBLE PRECISION,
    "dscr" DOUBLE PRECISION,
    "break_even_occupancy" DOUBLE PRECISION,
    "assumptions" JSONB,
    "ai_summary" TEXT,
    "status" VARCHAR(24) NOT NULL DEFAULT 'draft',
    "created_by_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "investor_analysis_cases_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_investor_analysis_cases_owner" ON "investor_analysis_cases"("owner_type", "owner_id");

CREATE TABLE IF NOT EXISTS "investor_scenarios" (
    "id" TEXT NOT NULL,
    "investor_analysis_case_id" TEXT NOT NULL,
    "scenario_name" TEXT NOT NULL,
    "monthly_rent_cents" INTEGER,
    "annual_appreciation_rate" DOUBLE PRECISION,
    "exit_year" INTEGER,
    "sale_cost_rate" DOUBLE PRECISION,
    "projected_value_cents" INTEGER,
    "projected_profit_cents" INTEGER,
    "projected_roi" DOUBLE PRECISION,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "investor_scenarios_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_investor_scenarios_case" ON "investor_scenarios"("investor_analysis_case_id");

ALTER TABLE "investor_scenarios" ADD CONSTRAINT "investor_scenarios_investor_analysis_case_id_fkey" FOREIGN KEY ("investor_analysis_case_id") REFERENCES "investor_analysis_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
