-- AI Growth Brain: recommendations, approvals, outcome events.
-- Idempotent for partially-applied databases.

DO $$ BEGIN
  CREATE TYPE "GrowthBrainDomain" AS ENUM ('supply', 'demand', 'seo', 'content', 'conversion', 'revenue', 'retention');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "GrowthBrainPriority" AS ENUM ('low', 'medium', 'high');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "GrowthBrainApprovalStatus" AS ENUM ('pending', 'approved', 'rejected', 'executed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "growth_brain_recommendations" (
    "id" TEXT NOT NULL,
    "type" VARCHAR(96) NOT NULL,
    "domain" "GrowthBrainDomain" NOT NULL,
    "priority" "GrowthBrainPriority" NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "title" VARCHAR(400) NOT NULL,
    "description" TEXT NOT NULL,
    "reasoning" TEXT NOT NULL,
    "suggested_action" TEXT NOT NULL,
    "auto_runnable" BOOLEAN NOT NULL DEFAULT false,
    "requires_approval" BOOLEAN NOT NULL DEFAULT true,
    "target_entity_type" VARCHAR(64),
    "target_entity_id" VARCHAR(64),
    "metadata_json" JSONB,
    "run_id" VARCHAR(64) NOT NULL,
    "status" VARCHAR(24) NOT NULL DEFAULT 'active',
    "fingerprint" VARCHAR(160) NOT NULL,
    "viewed_count" INTEGER NOT NULL DEFAULT 0,
    "dismissed_count" INTEGER NOT NULL DEFAULT 0,
    "approved_count" INTEGER NOT NULL DEFAULT 0,
    "executed_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "growth_brain_recommendations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "growth_brain_recommendations_fingerprint_key" ON "growth_brain_recommendations"("fingerprint");

CREATE INDEX IF NOT EXISTS "growth_brain_recommendations_domain_priority_idx" ON "growth_brain_recommendations"("domain", "priority");

CREATE INDEX IF NOT EXISTS "growth_brain_recommendations_run_id_idx" ON "growth_brain_recommendations"("run_id");

CREATE INDEX IF NOT EXISTS "growth_brain_recommendations_status_created_at_idx" ON "growth_brain_recommendations"("status", "created_at");

CREATE TABLE IF NOT EXISTS "growth_brain_approvals" (
    "id" TEXT NOT NULL,
    "recommendation_id" TEXT NOT NULL,
    "status" "GrowthBrainApprovalStatus" NOT NULL DEFAULT 'pending',
    "reviewer_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "executed_at" TIMESTAMP(3),

    CONSTRAINT "growth_brain_approvals_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "growth_brain_approvals_recommendation_id_idx" ON "growth_brain_approvals"("recommendation_id");

CREATE INDEX IF NOT EXISTS "growth_brain_approvals_status_created_at_idx" ON "growth_brain_approvals"("status", "created_at");

DO $$ BEGIN
  ALTER TABLE "growth_brain_approvals" ADD CONSTRAINT "growth_brain_approvals_recommendation_id_fkey" FOREIGN KEY ("recommendation_id") REFERENCES "growth_brain_recommendations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "growth_brain_approvals" ADD CONSTRAINT "growth_brain_approvals_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "growth_brain_outcome_events" (
    "id" TEXT NOT NULL,
    "recommendation_id" TEXT NOT NULL,
    "event_type" VARCHAR(32) NOT NULL,
    "metadata_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "growth_brain_outcome_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "growth_brain_outcome_events_recommendation_id_created_at_idx" ON "growth_brain_outcome_events"("recommendation_id", "created_at");

DO $$ BEGIN
  ALTER TABLE "growth_brain_outcome_events" ADD CONSTRAINT "growth_brain_outcome_events_recommendation_id_fkey" FOREIGN KEY ("recommendation_id") REFERENCES "growth_brain_recommendations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
