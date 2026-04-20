-- CreateTable
CREATE TABLE "manager_ai_autonomy_actions" (
    "id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "payload_json" JSONB NOT NULL,
    "expected_impact" JSONB,
    "policy_results_json" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_at" TIMESTAMP(3),
    "executed_at" TIMESTAMP(3),
    "rolled_back_at" TIMESTAMP(3),

    CONSTRAINT "manager_ai_autonomy_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manager_ai_autonomy_outcomes" (
    "id" TEXT NOT NULL,
    "action_id" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "before_value" DOUBLE PRECISION,
    "after_value" DOUBLE PRECISION,
    "delta" DOUBLE PRECISION,
    "label" TEXT NOT NULL,
    "notes" TEXT,
    "observed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "manager_ai_autonomy_outcomes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manager_ai_autonomy_policy_events" (
    "id" TEXT NOT NULL,
    "rule_id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "allowed" BOOLEAN NOT NULL,
    "reason" TEXT NOT NULL,
    "context_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "manager_ai_autonomy_policy_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manager_ai_autonomy_learning_snapshots" (
    "id" TEXT NOT NULL,
    "model_version" TEXT NOT NULL,
    "total_actions" INTEGER NOT NULL,
    "positive_outcomes" INTEGER NOT NULL,
    "negative_outcomes" INTEGER NOT NULL,
    "success_rate" DOUBLE PRECISION NOT NULL,
    "average_revenue_delta" DOUBLE PRECISION NOT NULL,
    "average_occupancy_delta" DOUBLE PRECISION NOT NULL,
    "average_risk_reduction" DOUBLE PRECISION NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "manager_ai_autonomy_learning_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manager_ai_autonomy_pricing_decisions" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "suggested_price" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "delta_from_base" DOUBLE PRECISION NOT NULL,
    "factors_json" JSONB NOT NULL,
    "policy_results_json" JSONB NOT NULL,
    "should_auto_apply" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "manager_ai_autonomy_pricing_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manager_ai_autonomy_governance_state" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "mode" TEXT NOT NULL,
    "paused" BOOLEAN NOT NULL DEFAULT false,
    "active_domains_json" JSONB NOT NULL,
    "pending_approvals" INTEGER NOT NULL DEFAULT 0,
    "executed_today" INTEGER NOT NULL DEFAULT 0,
    "rolled_back_today" INTEGER NOT NULL DEFAULT 0,
    "critical_policy_events" INTEGER NOT NULL DEFAULT 0,
    "recommended_pause" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "manager_ai_autonomy_governance_state_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "manager_ai_autonomy_actions_domain_created_at_idx" ON "manager_ai_autonomy_actions"("domain", "created_at");

-- CreateIndex
CREATE INDEX "manager_ai_autonomy_outcomes_action_id_idx" ON "manager_ai_autonomy_outcomes"("action_id");

-- CreateIndex
CREATE INDEX "manager_ai_autonomy_outcomes_entity_type_entity_id_idx" ON "manager_ai_autonomy_outcomes"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "manager_ai_autonomy_policy_events_domain_created_at_idx" ON "manager_ai_autonomy_policy_events"("domain", "created_at");

-- CreateIndex
CREATE INDEX "manager_ai_autonomy_learning_snapshots_updated_at_idx" ON "manager_ai_autonomy_learning_snapshots"("updated_at");

-- CreateIndex
CREATE INDEX "manager_ai_autonomy_pricing_decisions_listing_id_created_at_idx" ON "manager_ai_autonomy_pricing_decisions"("listing_id", "created_at");
