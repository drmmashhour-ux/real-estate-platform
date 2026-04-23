-- Pre-dispute risk assessments (aggregate signals — no legal findings)

CREATE TYPE "LecipmPreDisputeRiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

CREATE TABLE "lecipm_pre_dispute_risk_assessments" (
    "id" TEXT NOT NULL,
    "subject_type" "LecipmDisputeCaseEntityType" NOT NULL,
    "subject_id" VARCHAR(64) NOT NULL,
    "risk_score" INTEGER NOT NULL,
    "risk_level" "LecipmPreDisputeRiskLevel" NOT NULL,
    "signals_json" JSONB NOT NULL,
    "explain_json" JSONB NOT NULL,
    "actions_json" JSONB,
    "engine_version" VARCHAR(16) NOT NULL DEFAULT 'v1',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lecipm_pre_dispute_risk_assessments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lecipm_pre_dispute_risk_assessments_subject_type_subject_id_created_at_idx" ON "lecipm_pre_dispute_risk_assessments"("subject_type", "subject_id", "created_at" DESC);
