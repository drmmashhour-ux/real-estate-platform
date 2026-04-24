-- LECIPM operational trust score (distinct from BNHub `trust_scores` / platform_trust_scores)

CREATE TYPE "LecipmTrustEngineTargetType" AS ENUM ('BROKER', 'LISTING', 'DEAL', 'BOOKING', 'TERRITORY');

CREATE TYPE "LecipmTrustOperationalBand" AS ENUM (
  'HIGH_TRUST',
  'GOOD',
  'WATCH',
  'ELEVATED_RISK',
  'CRITICAL_REVIEW'
);

CREATE TABLE "lecipm_operational_trust_snapshots" (
    "id" TEXT NOT NULL,
    "target_type" "LecipmTrustEngineTargetType" NOT NULL,
    "target_id" VARCHAR(96) NOT NULL,
    "trust_score" INTEGER NOT NULL,
    "trust_band" "LecipmTrustOperationalBand" NOT NULL,
    "contributing_factors_json" JSONB NOT NULL,
    "warnings_json" JSONB NOT NULL DEFAULT '[]',
    "explain_json" JSONB NOT NULL,
    "delta_from_prior" INTEGER,
    "weight_profile_version" VARCHAR(24) NOT NULL DEFAULT 'v1',
    "inputs_summary_json" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lecipm_operational_trust_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lecipm_operational_trust_snapshots_target_type_target_id_created_at_idx" ON "lecipm_operational_trust_snapshots"("target_type", "target_id", "created_at" DESC);
CREATE INDEX "lecipm_operational_trust_snapshots_trust_band_created_at_idx" ON "lecipm_operational_trust_snapshots"("trust_band", "created_at");

CREATE TABLE "lecipm_operational_trust_alerts" (
    "id" TEXT NOT NULL,
    "target_type" "LecipmTrustEngineTargetType" NOT NULL,
    "target_id" VARCHAR(96) NOT NULL,
    "alert_kind" VARCHAR(48) NOT NULL,
    "message" TEXT NOT NULL,
    "severity" VARCHAR(24) NOT NULL,
    "metadata_json" JSONB NOT NULL DEFAULT '{}',
    "acknowledged_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lecipm_operational_trust_alerts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lecipm_operational_trust_alerts_target_type_target_id_idx" ON "lecipm_operational_trust_alerts"("target_type", "target_id");
CREATE INDEX "lecipm_operational_trust_alerts_created_at_idx" ON "lecipm_operational_trust_alerts"("created_at");
