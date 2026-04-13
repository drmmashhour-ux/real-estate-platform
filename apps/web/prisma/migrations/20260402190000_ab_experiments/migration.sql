-- CreateEnum
CREATE TYPE "ExperimentStatus" AS ENUM ('draft', 'running', 'paused', 'completed');

-- CreateTable
CREATE TABLE "experiments" (
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

-- CreateTable
CREATE TABLE "experiment_variants" (
    "id" TEXT NOT NULL,
    "experiment_id" TEXT NOT NULL,
    "variant_key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "config_json" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "experiment_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experiment_assignments" (
    "id" TEXT NOT NULL,
    "experiment_id" TEXT NOT NULL,
    "variant_id" TEXT NOT NULL,
    "user_id" TEXT,
    "session_id" VARCHAR(128) NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "experiment_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experiment_events" (
    "id" TEXT NOT NULL,
    "experiment_id" TEXT NOT NULL,
    "variant_id" TEXT NOT NULL,
    "user_id" TEXT,
    "session_id" VARCHAR(128) NOT NULL,
    "event_name" VARCHAR(64) NOT NULL,
    "metadata_json" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "experiment_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "experiments_slug_key" ON "experiments"("slug");

-- CreateIndex
CREATE INDEX "experiments_status_idx" ON "experiments"("status");

-- CreateIndex
CREATE INDEX "experiments_target_surface_idx" ON "experiments"("target_surface");

-- CreateIndex
CREATE INDEX "experiment_variants_experiment_id_idx" ON "experiment_variants"("experiment_id");

-- CreateIndex
CREATE UNIQUE INDEX "experiment_variants_experiment_id_variant_key_key" ON "experiment_variants"("experiment_id", "variant_key");

-- CreateIndex
CREATE INDEX "experiment_assignments_experiment_id_idx" ON "experiment_assignments"("experiment_id");

-- CreateIndex
CREATE INDEX "experiment_assignments_variant_id_idx" ON "experiment_assignments"("variant_id");

-- CreateIndex
CREATE INDEX "experiment_assignments_user_id_idx" ON "experiment_assignments"("user_id");

-- CreateIndex
CREATE INDEX "experiment_assignments_session_id_idx" ON "experiment_assignments"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "experiment_assignments_experiment_id_session_id_key" ON "experiment_assignments"("experiment_id", "session_id");

-- CreateIndex
CREATE INDEX "experiment_events_experiment_id_idx" ON "experiment_events"("experiment_id");

-- CreateIndex
CREATE INDEX "experiment_events_variant_id_idx" ON "experiment_events"("variant_id");

-- CreateIndex
CREATE INDEX "experiment_events_event_name_idx" ON "experiment_events"("event_name");

-- CreateIndex
CREATE INDEX "experiment_events_session_id_idx" ON "experiment_events"("session_id");

-- AddForeignKey
ALTER TABLE "experiment_variants" ADD CONSTRAINT "experiment_variants_experiment_id_fkey" FOREIGN KEY ("experiment_id") REFERENCES "experiments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experiment_assignments" ADD CONSTRAINT "experiment_assignments_experiment_id_fkey" FOREIGN KEY ("experiment_id") REFERENCES "experiments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experiment_assignments" ADD CONSTRAINT "experiment_assignments_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "experiment_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experiment_assignments" ADD CONSTRAINT "experiment_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experiment_events" ADD CONSTRAINT "experiment_events_experiment_id_fkey" FOREIGN KEY ("experiment_id") REFERENCES "experiments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experiment_events" ADD CONSTRAINT "experiment_events_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "experiment_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experiment_events" ADD CONSTRAINT "experiment_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
