-- Self-Expansion Engine: persisted recommendations + learning weights (advisory layer).

CREATE TABLE "lecipm_self_expansion_recommendations" (
    "id" TEXT NOT NULL,
    "fingerprint" VARCHAR(160) NOT NULL,
    "territory_id" VARCHAR(64) NOT NULL,
    "title" VARCHAR(280) NOT NULL,
    "category" VARCHAR(32) NOT NULL,
    "summary" TEXT NOT NULL,
    "expansion_score" DOUBLE PRECISION NOT NULL,
    "confidence_score" DOUBLE PRECISION NOT NULL,
    "urgency" VARCHAR(24) NOT NULL,
    "expected_impact_band" VARCHAR(48) NOT NULL,
    "required_effort" VARCHAR(24) NOT NULL,
    "entry_hub" VARCHAR(32) NOT NULL,
    "target_segment" VARCHAR(64),
    "phase_suggested" VARCHAR(24) NOT NULL,
    "recommendation_action_band" VARCHAR(24) NOT NULL,
    "execution_safety" VARCHAR(32) NOT NULL DEFAULT 'APPROVAL_REQUIRED',
    "phased_plan_summary" TEXT,
    "explanation_json" JSONB NOT NULL,
    "signals_snapshot_json" JSONB NOT NULL,
    "input_snapshot_json" JSONB NOT NULL,
    "first_actions_json" JSONB,
    "expected_risks_json" JSONB,
    "decision_status" VARCHAR(24) NOT NULL DEFAULT 'PROPOSED',
    "decided_at" TIMESTAMP(3),
    "decided_by_user_id" TEXT,
    "decision_reason" TEXT,
    "outcome_notes_json" JSONB,
    "outcome_impact_band" VARCHAR(48),
    "outcome_metrics_json" JSONB,
    "last_refreshed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lecipm_self_expansion_recommendations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "lecipm_self_expansion_recommendations_fingerprint_key" ON "lecipm_self_expansion_recommendations"("fingerprint");
CREATE INDEX "lecipm_self_expansion_recommendations_territory_id_idx" ON "lecipm_self_expansion_recommendations"("territory_id");
CREATE INDEX "lecipm_self_expansion_recommendations_decision_status_idx" ON "lecipm_self_expansion_recommendations"("decision_status");
CREATE INDEX "lecipm_self_expansion_recommendations_recommendation_action_band_idx" ON "lecipm_self_expansion_recommendations"("recommendation_action_band");

CREATE TABLE "lecipm_self_expansion_learning_state" (
    "key" VARCHAR(32) NOT NULL DEFAULT 'global',
    "hub_lift_json" JSONB NOT NULL,
    "blocker_lift_json" JSONB NOT NULL,
    "archetype_lift_json" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lecipm_self_expansion_learning_state_pkey" PRIMARY KEY ("key")
);
