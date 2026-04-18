-- Unified analytics EventLog + optional experiment metric rollups

CREATE TABLE "event_logs" (
    "id" TEXT NOT NULL,
    "event_type" VARCHAR(80) NOT NULL,
    "user_id" TEXT,
    "session_id" VARCHAR(128),
    "listing_id" VARCHAR(64),
    "entity_type" VARCHAR(64),
    "entity_id" VARCHAR(64),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "event_logs_event_type_created_at_idx" ON "event_logs"("event_type", "created_at");
CREATE INDEX "event_logs_user_id_created_at_idx" ON "event_logs"("user_id", "created_at");
CREATE INDEX "event_logs_session_id_created_at_idx" ON "event_logs"("session_id", "created_at");
CREATE INDEX "event_logs_listing_id_created_at_idx" ON "event_logs"("listing_id", "created_at");

ALTER TABLE "event_logs" ADD CONSTRAINT "event_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "experiment_metric_snapshots" (
    "id" TEXT NOT NULL,
    "experiment_id" TEXT NOT NULL,
    "variant_id" TEXT NOT NULL,
    "metric_key" VARCHAR(64) NOT NULL,
    "metric_value" DOUBLE PRECISION NOT NULL,
    "measured_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "experiment_metric_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "experiment_metric_snapshots_experiment_id_metric_key_measured_at_idx" ON "experiment_metric_snapshots"("experiment_id", "metric_key", "measured_at");
CREATE INDEX "experiment_metric_snapshots_variant_id_measured_at_idx" ON "experiment_metric_snapshots"("variant_id", "measured_at");

ALTER TABLE "experiment_metric_snapshots" ADD CONSTRAINT "experiment_metric_snapshots_experiment_id_fkey" FOREIGN KEY ("experiment_id") REFERENCES "experiments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "experiment_metric_snapshots" ADD CONSTRAINT "experiment_metric_snapshots_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "experiment_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
