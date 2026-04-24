-- Dispute prediction patterns / snapshots + system behavior adjustment proposals (advisory).

CREATE TYPE "LecipmDisputePredictedCategory" AS ENUM (
  'NO_SHOW_CONFLICT',
  'PAYMENT_FRICTION',
  'MISLEADING_EXPECTATION',
  'RESPONSE_DELAY_CONFLICT',
  'DOCUMENTATION_GAP',
  'NEGOTIATION_BREAKDOWN',
  'OTHER'
);

CREATE TYPE "LecipmSystemAdjustmentStatus" AS ENUM (
  'PROPOSED',
  'APPROVED',
  'REJECTED',
  'IMPLEMENTED',
  'REVERSED'
);

CREATE TABLE "lecipm_dispute_prediction_patterns" (
    "id" TEXT NOT NULL,
    "pattern_key" VARCHAR(196) NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "impact_score" DOUBLE PRECISION NOT NULL,
    "sample_size" INTEGER NOT NULL,
    "signals_fingerprint_json" JSONB NOT NULL,
    "recommended_prevention_json" JSONB NOT NULL,
    "top_outcome_category" "LecipmDisputeCaseCategory",
    "last_trained_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lecipm_dispute_prediction_patterns_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "lecipm_dispute_prediction_patterns_pattern_key_key" ON "lecipm_dispute_prediction_patterns"("pattern_key");
CREATE INDEX "lecipm_dispute_prediction_patterns_last_trained_at_idx" ON "lecipm_dispute_prediction_patterns"("last_trained_at");

CREATE TABLE "lecipm_dispute_prediction_snapshots" (
    "id" TEXT NOT NULL,
    "entity_type" "LecipmDisputeCaseEntityType" NOT NULL,
    "entity_id" VARCHAR(64) NOT NULL,
    "dispute_risk_score" INTEGER NOT NULL,
    "risk_band" "LecipmPreDisputeRiskLevel" NOT NULL,
    "predicted_category" "LecipmDisputePredictedCategory" NOT NULL,
    "top_signals_json" JSONB NOT NULL,
    "explain_json" JSONB NOT NULL,
    "prevention_actions_json" JSONB,
    "matched_pattern_keys_json" JSONB,
    "source_mix" VARCHAR(48) NOT NULL DEFAULT 'rules_plus_patterns',
    "engine_version" VARCHAR(16) NOT NULL DEFAULT 'v1',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lecipm_dispute_prediction_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lecipm_dispute_prediction_snapshots_entity_type_entity_id_created_at_idx" ON "lecipm_dispute_prediction_snapshots"("entity_type", "entity_id", "created_at" DESC);
CREATE INDEX "lecipm_dispute_prediction_snapshots_risk_band_created_at_idx" ON "lecipm_dispute_prediction_snapshots"("risk_band", "created_at");

CREATE TABLE "lecipm_system_behavior_adjustments" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(280) NOT NULL,
    "affected_domain" VARCHAR(64) NOT NULL,
    "territory" VARCHAR(120),
    "segment" VARCHAR(120),
    "hub" VARCHAR(120),
    "impact_band" VARCHAR(32) NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "urgency" VARCHAR(24) NOT NULL,
    "recommended_adjustment" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "status" "LecipmSystemAdjustmentStatus" NOT NULL DEFAULT 'PROPOSED',
    "proposed_by_user_id" TEXT,
    "approved_by_user_id" TEXT,
    "approval_reason" TEXT,
    "expected_effect" TEXT,
    "measured_outcome_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "implemented_at" TIMESTAMP(3),
    "reversed_at" TIMESTAMP(3),

    CONSTRAINT "lecipm_system_behavior_adjustments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lecipm_system_behavior_adjustments_status_created_at_idx" ON "lecipm_system_behavior_adjustments"("status", "created_at");
CREATE INDEX "lecipm_system_behavior_adjustments_affected_domain_created_at_idx" ON "lecipm_system_behavior_adjustments"("affected_domain", "created_at");

ALTER TABLE "lecipm_system_behavior_adjustments" ADD CONSTRAINT "lecipm_system_behavior_adjustments_proposed_by_user_id_fkey" FOREIGN KEY ("proposed_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "lecipm_system_behavior_adjustments" ADD CONSTRAINT "lecipm_system_behavior_adjustments_approved_by_user_id_fkey" FOREIGN KEY ("approved_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
