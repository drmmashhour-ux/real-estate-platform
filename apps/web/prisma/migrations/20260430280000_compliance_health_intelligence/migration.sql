-- Compliance health scores, risk events, and anomaly records (flag-only; human review).

CREATE TABLE "compliance_scores" (
    "id" TEXT NOT NULL,
    "owner_type" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "scope_type" TEXT NOT NULL DEFAULT 'global',
    "scope_id" TEXT,
    "score" DOUBLE PRECISION NOT NULL,
    "grade" TEXT NOT NULL,
    "risk_level" TEXT NOT NULL,
    "last_computed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "factors" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compliance_scores_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_compliance_score_owner_scope" ON "compliance_scores"("owner_type", "owner_id", "scope_type", "scope_id");
CREATE INDEX "idx_compliance_score_computed" ON "compliance_scores"("last_computed_at");

CREATE TABLE "compliance_risk_events" (
    "id" TEXT NOT NULL,
    "owner_type" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "related_entity_type" TEXT NOT NULL,
    "related_entity_id" TEXT,
    "risk_type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "detected_by" TEXT NOT NULL,
    "ai_confidence" DOUBLE PRECISION,
    "requires_review" BOOLEAN NOT NULL DEFAULT true,
    "reviewed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compliance_risk_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_compliance_risk_owner" ON "compliance_risk_events"("owner_type", "owner_id");
CREATE INDEX "idx_compliance_risk_type_created" ON "compliance_risk_events"("risk_type", "created_at");

CREATE TABLE "compliance_anomalies" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "anomaly_type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "baseline_value" DOUBLE PRECISION,
    "detected_value" DOUBLE PRECISION,
    "severity" TEXT NOT NULL,
    "detected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compliance_anomalies_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_compliance_anomaly_entity" ON "compliance_anomalies"("entity_type", "entity_id");
CREATE INDEX "idx_compliance_anomaly_detected" ON "compliance_anomalies"("detected_at");
