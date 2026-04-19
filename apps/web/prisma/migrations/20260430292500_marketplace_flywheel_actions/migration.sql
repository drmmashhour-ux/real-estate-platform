-- Operator-tracked flywheel actions and outcome evaluations (admin learning layer; no campaign execution).
CREATE TABLE "marketplace_flywheel_actions" (
    "id" TEXT NOT NULL,
    "type" VARCHAR(40) NOT NULL,
    "insight_id" VARCHAR(140) NOT NULL,
    "insight_type" VARCHAR(40) NOT NULL,
    "status" VARCHAR(24) NOT NULL,
    "note" TEXT,
    "created_by_user_id" TEXT NOT NULL,
    "baseline_brokers" INTEGER NOT NULL,
    "baseline_leads_30" INTEGER NOT NULL,
    "baseline_listings" INTEGER NOT NULL,
    "baseline_conversion_rate" DOUBLE PRECISION NOT NULL,
    "baseline_unlock_rate" DOUBLE PRECISION NOT NULL,
    "evaluation_window_days" INTEGER NOT NULL DEFAULT 14,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_flywheel_actions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "marketplace_flywheel_actions_insight_id_idx" ON "marketplace_flywheel_actions"("insight_id");
CREATE INDEX "marketplace_flywheel_actions_insight_type_status_idx" ON "marketplace_flywheel_actions"("insight_type", "status");
CREATE INDEX "marketplace_flywheel_actions_created_at_idx" ON "marketplace_flywheel_actions"("created_at");

ALTER TABLE "marketplace_flywheel_actions" ADD CONSTRAINT "marketplace_flywheel_actions_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "marketplace_flywheel_action_outcomes" (
    "id" TEXT NOT NULL,
    "action_id" TEXT NOT NULL,
    "measured_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "broker_count_delta" INTEGER NOT NULL,
    "lead_count_delta" INTEGER NOT NULL,
    "listing_count_delta" INTEGER NOT NULL,
    "conversion_rate_delta" DOUBLE PRECISION NOT NULL,
    "unlock_rate_delta" DOUBLE PRECISION NOT NULL,
    "revenue_delta" INTEGER,
    "outcome_score" VARCHAR(24) NOT NULL,
    "explanation" TEXT NOT NULL,

    CONSTRAINT "marketplace_flywheel_action_outcomes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "marketplace_flywheel_action_outcomes_action_id_measured_at_idx" ON "marketplace_flywheel_action_outcomes"("action_id", "measured_at");

ALTER TABLE "marketplace_flywheel_action_outcomes" ADD CONSTRAINT "marketplace_flywheel_action_outcomes_action_id_fkey" FOREIGN KEY ("action_id") REFERENCES "marketplace_flywheel_actions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
