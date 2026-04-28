-- ESG retrofit planner + financing matcher (LECIPM)

-- Bootstrap: `esg_actions` is required by FKs below but had no earlier migration creating the table (schema model EsgAction @@map("esg_actions")).
CREATE TABLE IF NOT EXISTS "esg_actions" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "title" VARCHAR(256) NOT NULL,
    "description" TEXT NOT NULL,
    "category" VARCHAR(24) NOT NULL,
    "action_type" VARCHAR(24) NOT NULL,
    "priority" VARCHAR(16) NOT NULL,
    "status" VARCHAR(16) NOT NULL DEFAULT 'OPEN',
    "reason_code" VARCHAR(64) NOT NULL,
    "reason_text" TEXT,
    "estimated_score_impact" DOUBLE PRECISION,
    "estimated_carbon_impact" DOUBLE PRECISION,
    "estimated_confidence_impact" DOUBLE PRECISION,
    "estimated_cost_band" VARCHAR(16),
    "estimated_effort_band" VARCHAR(16),
    "estimated_timeline_band" VARCHAR(16),
    "payback_band" VARCHAR(16),
    "owner_type" VARCHAR(16),
    "assignee_user_id" TEXT,
    "blockers_json" JSONB,
    "dependencies_json" JSONB,
    "evidence_needed_json" JSONB,
    "implementation_notes" TEXT,
    "generated_from_version" VARCHAR(24),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "esg_actions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "esg_actions_listing_id_status_idx" ON "esg_actions"("listing_id", "status");
CREATE INDEX IF NOT EXISTS "esg_actions_listing_id_reason_code_idx" ON "esg_actions"("listing_id", "reason_code");
CREATE INDEX IF NOT EXISTS "esg_actions_assignee_user_id_idx" ON "esg_actions"("assignee_user_id");
DO $$ BEGIN
  ALTER TABLE "esg_actions" ADD CONSTRAINT "esg_actions_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "esg_actions" ADD CONSTRAINT "esg_actions_assignee_user_id_fkey" FOREIGN KEY ("assignee_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE "esg_retrofit_plans" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "plan_name" VARCHAR(128) NOT NULL,
    "strategy_type" VARCHAR(24) NOT NULL,
    "summary_text" TEXT,
    "total_estimated_cost_band" VARCHAR(32),
    "total_estimated_impact_band" VARCHAR(32),
    "total_timeline_band" VARCHAR(32),
    "expected_score_band" VARCHAR(32),
    "expected_carbon_reduction_band" VARCHAR(32),
    "expected_confidence_improvement" VARCHAR(32),
    "assumptions_json" JSONB,
    "plan_version" VARCHAR(24),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "esg_retrofit_plans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "esg_retrofit_actions" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "action_id" TEXT,
    "title" VARCHAR(256) NOT NULL,
    "category" VARCHAR(24) NOT NULL,
    "phase" INTEGER NOT NULL,
    "cost_band" VARCHAR(16),
    "impact_band" VARCHAR(24),
    "timeline_band" VARCHAR(24),
    "payback_band" VARCHAR(16),
    "dependencies_json" JSONB,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "esg_retrofit_actions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "esg_financing_options" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT,
    "plan_id" TEXT,
    "financing_type" VARCHAR(32) NOT NULL,
    "name" VARCHAR(256) NOT NULL,
    "provider" VARCHAR(128),
    "eligibility_criteria" TEXT,
    "applicable_actions_json" JSONB,
    "cost_coverage_band" VARCHAR(24),
    "benefit_type" VARCHAR(24) NOT NULL,
    "priority" VARCHAR(16),
    "notes" TEXT,
    "reasoning" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "esg_financing_options_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "esg_retrofit_scenarios" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "scenario_name" VARCHAR(128) NOT NULL,
    "selected_actions_json" JSONB NOT NULL,
    "total_cost_band" VARCHAR(32),
    "total_impact_band" VARCHAR(32),
    "timeline_band" VARCHAR(32),
    "expected_score_band" VARCHAR(32),
    "expected_carbon_band" VARCHAR(32),
    "financing_fit" VARCHAR(32),
    "assumptions_json" JSONB,
    "risks_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "esg_retrofit_scenarios_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "esg_retrofit_plans_listing_id_strategy_type_idx" ON "esg_retrofit_plans"("listing_id", "strategy_type");
CREATE INDEX "esg_retrofit_plans_listing_id_updated_at_idx" ON "esg_retrofit_plans"("listing_id", "updated_at" DESC);
CREATE INDEX "esg_retrofit_actions_plan_id_phase_idx" ON "esg_retrofit_actions"("plan_id", "phase");
CREATE INDEX "esg_financing_options_listing_id_idx" ON "esg_financing_options"("listing_id");
CREATE INDEX "esg_financing_options_plan_id_idx" ON "esg_financing_options"("plan_id");
CREATE INDEX "esg_retrofit_scenarios_listing_id_created_at_idx" ON "esg_retrofit_scenarios"("listing_id", "created_at" DESC);

ALTER TABLE "esg_retrofit_plans" ADD CONSTRAINT "esg_retrofit_plans_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "esg_retrofit_actions" ADD CONSTRAINT "esg_retrofit_actions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "esg_retrofit_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "esg_retrofit_actions" ADD CONSTRAINT "esg_retrofit_actions_action_id_fkey" FOREIGN KEY ("action_id") REFERENCES "esg_actions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "esg_financing_options" ADD CONSTRAINT "esg_financing_options_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "esg_financing_options" ADD CONSTRAINT "esg_financing_options_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "esg_retrofit_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "esg_retrofit_scenarios" ADD CONSTRAINT "esg_retrofit_scenarios_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
