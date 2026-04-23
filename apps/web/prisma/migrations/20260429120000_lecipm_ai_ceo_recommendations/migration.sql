-- AI CEO Mode: strategic recommendation records (advisory layer; audit + workflow).

CREATE TABLE "lecipm_ai_ceo_recommendations" (
    "id" TEXT NOT NULL,
    "fingerprint" VARCHAR(160) NOT NULL,
    "title" VARCHAR(280) NOT NULL,
    "category" VARCHAR(24) NOT NULL,
    "summary" TEXT NOT NULL,
    "expected_impact_band" VARCHAR(48) NOT NULL,
    "confidence_score" DOUBLE PRECISION NOT NULL,
    "urgency" VARCHAR(24) NOT NULL,
    "required_effort" VARCHAR(24) NOT NULL,
    "affected_domains" JSONB NOT NULL,
    "explanation_json" JSONB NOT NULL,
    "signals_snapshot_json" JSONB NOT NULL,
    "input_snapshot_json" JSONB NOT NULL,
    "execution_safety" VARCHAR(32) NOT NULL DEFAULT 'APPROVAL_REQUIRED',
    "prioritization_bucket" VARCHAR(48),
    "decision_status" VARCHAR(24) NOT NULL DEFAULT 'pending',
    "decided_at" TIMESTAMP(3),
    "decided_by_user_id" TEXT,
    "outcome_impact_band" VARCHAR(48),
    "outcome_notes_json" JSONB,
    "last_refreshed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lecipm_ai_ceo_recommendations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "lecipm_ai_ceo_recommendations_fingerprint_key" ON "lecipm_ai_ceo_recommendations"("fingerprint");
CREATE INDEX "lecipm_ai_ceo_recommendations_decision_status_idx" ON "lecipm_ai_ceo_recommendations"("decision_status");
CREATE INDEX "lecipm_ai_ceo_recommendations_prioritization_bucket_idx" ON "lecipm_ai_ceo_recommendations"("prioritization_bucket");
