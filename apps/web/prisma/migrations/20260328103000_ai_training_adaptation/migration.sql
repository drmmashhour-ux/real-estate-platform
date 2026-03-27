-- AlterTable
ALTER TABLE "copilot_memory_items"
ADD COLUMN "listing_id" TEXT,
ADD COLUMN "city" TEXT,
ADD COLUMN "property_type" TEXT,
ADD COLUMN "embedding_vector" JSONB;

-- CreateTable
CREATE TABLE "ai_feedback_events" (
  "id" TEXT NOT NULL,
  "subsystem" TEXT NOT NULL,
  "entity_type" TEXT NOT NULL,
  "entity_id" TEXT NOT NULL,
  "user_id" TEXT,
  "prompt_or_query" TEXT NOT NULL,
  "output_summary" TEXT NOT NULL,
  "rating" INTEGER,
  "accepted" BOOLEAN,
  "action_taken" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ai_feedback_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_eval_runs" (
  "id" TEXT NOT NULL,
  "subsystem" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "metrics" JSONB,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completed_at" TIMESTAMPTZ(6),
  CONSTRAINT "ai_eval_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_eval_items" (
  "id" TEXT NOT NULL,
  "eval_run_id" TEXT NOT NULL,
  "input_payload" JSONB NOT NULL,
  "expected_output" JSONB,
  "actual_output" JSONB NOT NULL,
  "passed" BOOLEAN,
  "notes" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ai_eval_items_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "idx_copilot_memory_listing_id" ON "copilot_memory_items"("listing_id");
CREATE INDEX "idx_copilot_memory_city" ON "copilot_memory_items"("city");
CREATE INDEX "idx_copilot_memory_property_type" ON "copilot_memory_items"("property_type");

CREATE INDEX "idx_ai_feedback_subsystem" ON "ai_feedback_events"("subsystem");
CREATE INDEX "idx_ai_feedback_entity" ON "ai_feedback_events"("entity_type", "entity_id");
CREATE INDEX "idx_ai_feedback_user" ON "ai_feedback_events"("user_id");
CREATE INDEX "idx_ai_feedback_created_at" ON "ai_feedback_events"("created_at");

CREATE INDEX "idx_ai_eval_runs_subsystem" ON "ai_eval_runs"("subsystem");
CREATE INDEX "idx_ai_eval_runs_status" ON "ai_eval_runs"("status");
CREATE INDEX "idx_ai_eval_runs_created_at" ON "ai_eval_runs"("created_at");

CREATE INDEX "idx_ai_eval_items_run_id" ON "ai_eval_items"("eval_run_id");
CREATE INDEX "idx_ai_eval_items_created_at" ON "ai_eval_items"("created_at");

-- Foreign key
ALTER TABLE "ai_eval_items"
ADD CONSTRAINT "ai_eval_items_eval_run_id_fkey"
FOREIGN KEY ("eval_run_id") REFERENCES "ai_eval_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
