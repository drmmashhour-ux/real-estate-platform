-- Autonomous ESG Optimization Engine (LECIPM)

CREATE TABLE "esg_optimization_plans" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "status" VARCHAR(24) NOT NULL DEFAULT 'DRAFT',
    "optimizer_version" VARCHAR(24) NOT NULL,
    "strategy_type" VARCHAR(32),
    "objective_mode" VARCHAR(32),
    "confidence_level" VARCHAR(24),
    "headline_recommendation" TEXT,
    "executive_summary" TEXT,
    "current_score" DOUBLE PRECISION,
    "current_grade" VARCHAR(8),
    "target_band" VARCHAR(48),
    "expected_readiness_shift" VARCHAR(256),
    "plan_json" JSONB NOT NULL,
    "rationale_json" JSONB NOT NULL,
    "assumptions_json" JSONB NOT NULL,
    "policy_version" VARCHAR(24),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "activated_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "esg_optimization_plans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "esg_optimization_actions" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "source_action_id" TEXT,
    "rank" INTEGER NOT NULL,
    "title" VARCHAR(256) NOT NULL,
    "action_type" VARCHAR(24) NOT NULL,
    "category" VARCHAR(24) NOT NULL,
    "priority" VARCHAR(16) NOT NULL,
    "expected_value_score" DOUBLE PRECISION,
    "expected_score_impact_band" VARCHAR(48),
    "expected_confidence_impact_band" VARCHAR(48),
    "expected_carbon_impact_band" VARCHAR(48),
    "expected_readiness_impact_band" VARCHAR(48),
    "cost_band" VARCHAR(16),
    "effort_band" VARCHAR(16),
    "timeline_band" VARCHAR(24),
    "payback_band" VARCHAR(16),
    "requires_approval" BOOLEAN NOT NULL DEFAULT true,
    "decision_status" VARCHAR(16) NOT NULL DEFAULT 'PENDING',
    "explanation" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "esg_optimization_actions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "esg_optimization_runs" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "plan_id" TEXT,
    "run_type" VARCHAR(16) NOT NULL,
    "optimizer_version" VARCHAR(24) NOT NULL,
    "input_snapshot_json" JSONB NOT NULL,
    "output_snapshot_json" JSONB NOT NULL,
    "selected_strategy" VARCHAR(32),
    "objective_mode" VARCHAR(32),
    "status" VARCHAR(16) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "esg_optimization_runs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "esg_outcome_events" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "action_id" TEXT,
    "optimization_action_id" TEXT,
    "event_type" VARCHAR(32) NOT NULL,
    "outcome_category" VARCHAR(16),
    "before_json" JSONB,
    "after_json" JSONB,
    "delta_json" JSONB,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "esg_outcome_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "esg_optimization_policies" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT,
    "listing_id" TEXT,
    "autonomy_mode" VARCHAR(24) NOT NULL DEFAULT 'SAFE_APPROVAL',
    "allow_evidence_actions" BOOLEAN NOT NULL DEFAULT true,
    "allow_disclosure_actions" BOOLEAN NOT NULL DEFAULT true,
    "allow_operational_actions" BOOLEAN NOT NULL DEFAULT true,
    "allow_capex_actions" BOOLEAN NOT NULL DEFAULT false,
    "primary_objective" VARCHAR(32) NOT NULL DEFAULT 'BALANCED',
    "risk_tolerance" VARCHAR(16) NOT NULL DEFAULT 'MEDIUM',
    "budget_mode" VARCHAR(24),
    "preferred_strategy" VARCHAR(32),
    "calibration_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "esg_optimization_policies_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "esg_optimization_plans_listing_id_status_idx" ON "esg_optimization_plans"("listing_id", "status");
CREATE INDEX "esg_optimization_plans_listing_id_updated_at_idx" ON "esg_optimization_plans"("listing_id", "updated_at" DESC);
CREATE INDEX "esg_optimization_actions_plan_id_rank_idx" ON "esg_optimization_actions"("plan_id", "rank");
CREATE INDEX "esg_optimization_actions_listing_id_idx" ON "esg_optimization_actions"("listing_id");
CREATE INDEX "esg_optimization_runs_listing_id_created_at_idx" ON "esg_optimization_runs"("listing_id", "created_at" DESC);
CREATE INDEX "esg_outcome_events_listing_id_created_at_idx" ON "esg_outcome_events"("listing_id", "created_at" DESC);
CREATE INDEX "esg_optimization_policies_owner_id_idx" ON "esg_optimization_policies"("owner_id");
CREATE INDEX "esg_optimization_policies_listing_id_idx" ON "esg_optimization_policies"("listing_id");

ALTER TABLE "esg_optimization_plans" ADD CONSTRAINT "esg_optimization_plans_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "esg_optimization_actions" ADD CONSTRAINT "esg_optimization_actions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "esg_optimization_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "esg_optimization_actions" ADD CONSTRAINT "esg_optimization_actions_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "esg_optimization_actions" ADD CONSTRAINT "esg_optimization_actions_source_action_id_fkey" FOREIGN KEY ("source_action_id") REFERENCES "esg_actions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "esg_optimization_runs" ADD CONSTRAINT "esg_optimization_runs_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "esg_optimization_runs" ADD CONSTRAINT "esg_optimization_runs_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "esg_optimization_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "esg_outcome_events" ADD CONSTRAINT "esg_outcome_events_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "esg_outcome_events" ADD CONSTRAINT "esg_outcome_events_action_id_fkey" FOREIGN KEY ("action_id") REFERENCES "esg_actions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "esg_outcome_events" ADD CONSTRAINT "esg_outcome_events_optimization_action_id_fkey" FOREIGN KEY ("optimization_action_id") REFERENCES "esg_optimization_actions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "esg_optimization_policies" ADD CONSTRAINT "esg_optimization_policies_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "esg_optimization_policies" ADD CONSTRAINT "esg_optimization_policies_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
