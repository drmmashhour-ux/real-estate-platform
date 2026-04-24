-- Wave 9: contextual bandit (lite) + auditable playbook assignments
-- Requires existing enums: MemoryDomain, PlaybookExecutionMode, MemoryOutcomeStatus

CREATE TYPE "PlaybookAssignmentSelectionMode" AS ENUM ('exploit', 'explore', 'manual');

CREATE TABLE "playbook_bandit_stats" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "domain" "MemoryDomain" NOT NULL,
    "segment_key" TEXT NOT NULL DEFAULT '',
    "market_key" TEXT NOT NULL DEFAULT '',
    "playbook_id" TEXT NOT NULL,
    "playbook_version_id" TEXT NOT NULL DEFAULT '',
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "executions" INTEGER NOT NULL DEFAULT 0,
    "successes" INTEGER NOT NULL DEFAULT 0,
    "failures" INTEGER NOT NULL DEFAULT 0,
    "avg_reward" DOUBLE PRECISION,
    "avg_revenue" DOUBLE PRECISION,
    "avg_conversion" DOUBLE PRECISION,
    "avg_risk_score" DOUBLE PRECISION,
    "last_selected_at" TIMESTAMP(3),
    "last_outcome_at" TIMESTAMP(3),

    CONSTRAINT "playbook_bandit_stats_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "playbook_bandit_context_key" ON "playbook_bandit_stats"("domain", "playbook_id", "playbook_version_id", "segment_key", "market_key");
CREATE INDEX "playbook_bandit_stats_domain_created_at_idx" ON "playbook_bandit_stats"("domain", "created_at");
CREATE INDEX "playbook_bandit_stats_domain_segment_key_market_key_idx" ON "playbook_bandit_stats"("domain", "segment_key", "market_key");
CREATE INDEX "playbook_bandit_stats_playbook_id_domain_idx" ON "playbook_bandit_stats"("playbook_id", "domain");

CREATE TABLE "playbook_assignments" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "domain" "MemoryDomain" NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "playbook_id" TEXT NOT NULL,
    "playbook_version_id" TEXT,
    "playbook_version_key" TEXT NOT NULL DEFAULT '',
    "recommendation_score" DOUBLE PRECISION,
    "selection_score" DOUBLE PRECISION,
    "exploration_rate" DOUBLE PRECISION,
    "selection_mode" "PlaybookAssignmentSelectionMode" NOT NULL,
    "context_snapshot" JSONB NOT NULL,
    "segment_key" TEXT,
    "market_key" TEXT,
    "fingerprint" TEXT,
    "execution_mode" "PlaybookExecutionMode" NOT NULL,
    "executed" BOOLEAN NOT NULL DEFAULT false,
    "memory_record_id" TEXT,
    "outcome_status" "MemoryOutcomeStatus",
    "realized_value" DOUBLE PRECISION,
    "realized_revenue" DOUBLE PRECISION,
    "realized_conversion" DOUBLE PRECISION,

    CONSTRAINT "playbook_assignments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "playbook_assignments_domain_created_at_idx" ON "playbook_assignments"("domain", "created_at");
CREATE INDEX "playbook_assignments_playbook_id_created_at_idx" ON "playbook_assignments"("playbook_id", "created_at");
CREATE INDEX "playbook_assignments_entity_type_entity_id_idx" ON "playbook_assignments"("entity_type", "entity_id");
CREATE INDEX "playbook_assignments_memory_record_id_idx" ON "playbook_assignments"("memory_record_id");

ALTER TABLE "playbook_assignments"
ADD CONSTRAINT "playbook_assignments_memory_record_id_fkey"
FOREIGN KEY ("memory_record_id") REFERENCES "playbook_memory_records"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
