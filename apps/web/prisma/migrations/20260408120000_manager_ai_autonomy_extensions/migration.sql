-- LECIPM Manager AI: kill switches, pause window, override/health/eval audit tables

ALTER TABLE "manager_ai_platform_settings" ADD COLUMN IF NOT EXISTS "global_kill_switch" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "manager_ai_platform_settings" ADD COLUMN IF NOT EXISTS "domain_kill_switches_json" JSONB;
ALTER TABLE "manager_ai_platform_settings" ADD COLUMN IF NOT EXISTS "autonomy_paused_until" TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS "manager_ai_override_events" (
  "id" TEXT NOT NULL,
  "actor_user_id" TEXT NOT NULL,
  "scope" TEXT NOT NULL,
  "target_json" JSONB,
  "note" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "manager_ai_override_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "manager_ai_override_events_actor_user_id_created_at_idx"
  ON "manager_ai_override_events" ("actor_user_id", "created_at");

ALTER TABLE "manager_ai_override_events"
  ADD CONSTRAINT "manager_ai_override_events_actor_user_id_fkey"
  FOREIGN KEY ("actor_user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "manager_ai_health_events" (
  "id" TEXT NOT NULL,
  "level" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "payload" JSONB,
  "correlation_id" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "manager_ai_health_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "manager_ai_health_events_created_at_idx"
  ON "manager_ai_health_events" ("created_at");

CREATE TABLE IF NOT EXISTS "manager_ai_outcome_evals" (
  "id" TEXT NOT NULL,
  "user_id" TEXT,
  "source_type" TEXT NOT NULL,
  "source_id" TEXT NOT NULL,
  "outcome" TEXT NOT NULL,
  "score" DOUBLE PRECISION,
  "payload" JSONB,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "manager_ai_outcome_evals_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "manager_ai_outcome_evals_source_type_source_id_idx"
  ON "manager_ai_outcome_evals" ("source_type", "source_id");

CREATE INDEX IF NOT EXISTS "manager_ai_outcome_evals_user_id_created_at_idx"
  ON "manager_ai_outcome_evals" ("user_id", "created_at");

ALTER TABLE "manager_ai_outcome_evals"
  ADD CONSTRAINT "manager_ai_outcome_evals_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
