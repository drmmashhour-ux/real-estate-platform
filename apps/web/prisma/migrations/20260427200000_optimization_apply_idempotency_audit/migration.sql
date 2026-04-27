-- Idempotent apply: mark listing optimization suggestions once; extended AI execution audit.

ALTER TABLE "listing_optimization_suggestions"
ADD COLUMN IF NOT EXISTS "applied_at" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "listing_optimization_suggestions_applied_at_idx" ON "listing_optimization_suggestions"("applied_at");

CREATE UNIQUE INDEX IF NOT EXISTS "idx_suggestion_applied_once" ON "listing_optimization_suggestions" ("id")
WHERE "applied_at" IS NOT NULL;

ALTER TABLE "ai_execution_logs"
ADD COLUMN IF NOT EXISTS "before_snapshot" JSONB,
ADD COLUMN IF NOT EXISTS "after_snapshot" JSONB;
