-- Unified analytics EventLog + optional experiment metric rollups
-- Bootstrap experiments + variants (normally 20260402190000_ab_experiments) — must exist before FKs below.
DO $$ BEGIN
  CREATE TYPE "ExperimentStatus" AS ENUM ('draft', 'running', 'paused', 'completed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "experiments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "ExperimentStatus" NOT NULL DEFAULT 'draft',
    "target_surface" TEXT NOT NULL,
    "hypothesis" TEXT,
    "primary_metric" TEXT NOT NULL,
    "traffic_split_json" JSONB NOT NULL,
    "start_at" TIMESTAMP(3),
    "end_at" TIMESTAMP(3),
    "winner_variant_key" TEXT,
    "stopped_variant_keys" JSONB NOT NULL DEFAULT '[]',
    "archived_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "experiments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "experiment_variants" (
    "id" TEXT NOT NULL,
    "experiment_id" TEXT NOT NULL,
    "variant_key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "config_json" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "experiment_variants_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "experiments_slug_key" ON "experiments"("slug");
CREATE INDEX IF NOT EXISTS "experiments_status_idx" ON "experiments"("status");
CREATE INDEX IF NOT EXISTS "experiments_target_surface_idx" ON "experiments"("target_surface");
CREATE INDEX IF NOT EXISTS "experiment_variants_experiment_id_idx" ON "experiment_variants"("experiment_id");
CREATE UNIQUE INDEX IF NOT EXISTS "experiment_variants_experiment_id_variant_key_key" ON "experiment_variants"("experiment_id", "variant_key");

DO $$ BEGIN
  ALTER TABLE "experiment_variants" ADD CONSTRAINT "experiment_variants_experiment_id_fkey" FOREIGN KEY ("experiment_id") REFERENCES "experiments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "event_logs" (
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

CREATE INDEX IF NOT EXISTS "event_logs_event_type_created_at_idx" ON "event_logs"("event_type", "created_at");
CREATE INDEX IF NOT EXISTS "event_logs_user_id_created_at_idx" ON "event_logs"("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "event_logs_session_id_created_at_idx" ON "event_logs"("session_id", "created_at");
CREATE INDEX IF NOT EXISTS "event_logs_listing_id_created_at_idx" ON "event_logs"("listing_id", "created_at");

DO $$ BEGIN
  ALTER TABLE "event_logs" ADD CONSTRAINT "event_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "experiment_metric_snapshots" (
    "id" TEXT NOT NULL,
    "experiment_id" TEXT NOT NULL,
    "variant_id" TEXT NOT NULL,
    "metric_key" VARCHAR(64) NOT NULL,
    "metric_value" DOUBLE PRECISION NOT NULL,
    "measured_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "experiment_metric_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "experiment_metric_snapshots_experiment_id_metric_key_measured_at_idx" ON "experiment_metric_snapshots"("experiment_id", "metric_key", "measured_at");
CREATE INDEX IF NOT EXISTS "experiment_metric_snapshots_variant_id_measured_at_idx" ON "experiment_metric_snapshots"("variant_id", "measured_at");

DO $$ BEGIN
  ALTER TABLE "experiment_metric_snapshots" ADD CONSTRAINT "experiment_metric_snapshots_experiment_id_fkey" FOREIGN KEY ("experiment_id") REFERENCES "experiments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "experiment_metric_snapshots" ADD CONSTRAINT "experiment_metric_snapshots_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "experiment_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
