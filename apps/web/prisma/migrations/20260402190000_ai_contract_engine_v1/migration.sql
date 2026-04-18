-- AI Contract Engine v1 — deal assets, workflow transitions, suggestion audit, optional version snapshot

ALTER TABLE "deals" ADD COLUMN IF NOT EXISTS "contract_workflow_state" VARCHAR(32);

ALTER TABLE "deal_document_versions" ADD COLUMN IF NOT EXISTS "snapshot" JSONB;

CREATE TABLE IF NOT EXISTS "deal_assets" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "asset_type" VARCHAR(64) NOT NULL,
    "reference_id" VARCHAR(160),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deal_assets_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "deal_assets_deal_id_idx" ON "deal_assets"("deal_id");

ALTER TABLE "deal_assets" DROP CONSTRAINT IF EXISTS "deal_assets_deal_id_fkey";
ALTER TABLE "deal_assets" ADD CONSTRAINT "deal_assets_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "deal_state_transitions" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "from_state" VARCHAR(48) NOT NULL,
    "to_state" VARCHAR(48) NOT NULL,
    "reason" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deal_state_transitions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "deal_state_transitions_deal_id_created_at_idx" ON "deal_state_transitions"("deal_id", "created_at");

ALTER TABLE "deal_state_transitions" DROP CONSTRAINT IF EXISTS "deal_state_transitions_deal_id_fkey";
ALTER TABLE "deal_state_transitions" ADD CONSTRAINT "deal_state_transitions_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "deal_state_transitions" DROP CONSTRAINT IF EXISTS "deal_state_transitions_created_by_id_fkey";
ALTER TABLE "deal_state_transitions" ADD CONSTRAINT "deal_state_transitions_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "suggestion_decision_logs" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "document_id" TEXT,
    "suggestion_type" VARCHAR(64) NOT NULL,
    "suggestion_payload" JSONB NOT NULL,
    "action" VARCHAR(24) NOT NULL,
    "actor_id" TEXT NOT NULL,
    "source_references" JSONB,
    "validation_snapshot" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "suggestion_decision_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "suggestion_decision_logs_deal_id_created_at_idx" ON "suggestion_decision_logs"("deal_id", "created_at");
CREATE INDEX IF NOT EXISTS "suggestion_decision_logs_actor_id_idx" ON "suggestion_decision_logs"("actor_id");

ALTER TABLE "suggestion_decision_logs" DROP CONSTRAINT IF EXISTS "suggestion_decision_logs_deal_id_fkey";
ALTER TABLE "suggestion_decision_logs" ADD CONSTRAINT "suggestion_decision_logs_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "suggestion_decision_logs" DROP CONSTRAINT IF EXISTS "suggestion_decision_logs_actor_id_fkey";
ALTER TABLE "suggestion_decision_logs" ADD CONSTRAINT "suggestion_decision_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
