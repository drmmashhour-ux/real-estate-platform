-- Continuous calibration batches (internal admin).

CREATE TYPE "CalibrationBatchStatus" AS ENUM ('draft', 'running', 'completed', 'failed');
CREATE TYPE "CalibrationDriftSeverity" AS ENUM ('info', 'warning', 'critical');
CREATE TYPE "CalibrationDriftAlertStatus" AS ENUM ('open', 'acknowledged', 'dismissed');

CREATE TABLE "calibration_batches" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "status" "CalibrationBatchStatus" NOT NULL DEFAULT 'draft',
    "source_validation_run_ids" JSONB NOT NULL,
    "active_tuning_profile_id" TEXT,
    "listing_count" INTEGER NOT NULL DEFAULT 0,
    "target_min_items" INTEGER,
    "target_max_items" INTEGER,
    "composition_targets" JSONB,
    "metrics_json" JSONB,
    "drift_summary_json" JSONB,
    "tuning_review_recommended" BOOLEAN,
    "tuning_review_reasons_json" JSONB,
    "tuning_proposed" BOOLEAN,
    "tuning_applied" BOOLEAN,
    "created_by" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(6),

    CONSTRAINT "calibration_batches_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "calibration_batches_created_at_idx" ON "calibration_batches"("created_at");
CREATE INDEX "calibration_batches_status_idx" ON "calibration_batches"("status");
CREATE INDEX "calibration_batches_active_tuning_profile_id_idx" ON "calibration_batches"("active_tuning_profile_id");

ALTER TABLE "calibration_batches"
  ADD CONSTRAINT "calibration_batches_active_tuning_profile_id_fkey"
    FOREIGN KEY ("active_tuning_profile_id") REFERENCES "tuning_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "calibration_batch_items" (
    "id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "source_run_id" TEXT,
    "predicted_trust_score" INTEGER,
    "predicted_trust_confidence" INTEGER,
    "predicted_deal_score" INTEGER,
    "predicted_deal_confidence" INTEGER,
    "predicted_fraud_score" INTEGER,
    "predicted_recommendation" TEXT,
    "predicted_issue_codes" JSONB,
    "human_trust_label" TEXT,
    "human_deal_label" TEXT,
    "human_risk_label" TEXT,
    "fairness_rating" INTEGER,
    "needs_manual_review" BOOLEAN,
    "notes" TEXT,
    "segment_json" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calibration_batch_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uq_calibration_batch_item_entity" ON "calibration_batch_items"("batch_id", "entity_type", "entity_id");
CREATE INDEX "calibration_batch_items_batch_id_idx" ON "calibration_batch_items"("batch_id");
CREATE INDEX "calibration_batch_items_entity_type_entity_id_idx" ON "calibration_batch_items"("entity_type", "entity_id");

ALTER TABLE "calibration_batch_items"
  ADD CONSTRAINT "calibration_batch_items_batch_id_fkey"
    FOREIGN KEY ("batch_id") REFERENCES "calibration_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "calibration_drift_alerts" (
    "id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "alert_type" TEXT NOT NULL,
    "severity" "CalibrationDriftSeverity" NOT NULL,
    "metric_name" TEXT,
    "previous_value" DOUBLE PRECISION,
    "current_value" DOUBLE PRECISION,
    "threshold_value" DOUBLE PRECISION,
    "message" TEXT NOT NULL,
    "status" "CalibrationDriftAlertStatus" NOT NULL DEFAULT 'open',
    "segment_key" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calibration_drift_alerts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "calibration_drift_alerts_batch_id_idx" ON "calibration_drift_alerts"("batch_id");
CREATE INDEX "calibration_drift_alerts_status_idx" ON "calibration_drift_alerts"("status");
CREATE INDEX "calibration_drift_alerts_severity_idx" ON "calibration_drift_alerts"("severity");

ALTER TABLE "calibration_drift_alerts"
  ADD CONSTRAINT "calibration_drift_alerts_batch_id_fkey"
    FOREIGN KEY ("batch_id") REFERENCES "calibration_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
