-- Advisory-only lead pricing observation rows — no Stripe/checkout coupling.
CREATE TABLE "lead_pricing_result_observations" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "pricing_mode_used" VARCHAR(32) NOT NULL,
    "displayed_advisory_price" INTEGER NOT NULL,
    "base_price" INTEGER NOT NULL,
    "confidence_level" VARCHAR(16) NOT NULL,
    "measured_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "operator_action_taken" VARCHAR(24),
    "baseline_snapshot_json" JSONB NOT NULL,
    "evaluated_at" TIMESTAMP(3),
    "outcome_band" VARCHAR(24),
    "outcome_explanation" TEXT,
    "outcome_warnings_json" JSONB,

    CONSTRAINT "lead_pricing_result_observations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lead_pricing_result_observations_lead_id_measured_at_idx" ON "lead_pricing_result_observations"("lead_id", "measured_at");
CREATE INDEX "lead_pricing_result_observations_pricing_mode_used_outcome_band_idx" ON "lead_pricing_result_observations"("pricing_mode_used", "outcome_band");

ALTER TABLE "lead_pricing_result_observations" ADD CONSTRAINT "lead_pricing_result_observations_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
