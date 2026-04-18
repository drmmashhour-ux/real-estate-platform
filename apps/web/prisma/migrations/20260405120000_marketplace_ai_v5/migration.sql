-- Autonomous Marketplace AI v5 — agent memory + decision audit (no auto-exec).
CREATE TABLE "marketplace_agent_v5_memories" (
    "id" TEXT NOT NULL,
    "agent_kind" VARCHAR(32) NOT NULL,
    "subject_type" VARCHAR(32) NOT NULL,
    "subject_id" VARCHAR(64) NOT NULL,
    "memory_json" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_agent_v5_memories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uq_marketplace_agent_v5_memory_subject" ON "marketplace_agent_v5_memories"("agent_kind", "subject_type", "subject_id");
CREATE INDEX "marketplace_agent_v5_memories_subject_type_subject_id_idx" ON "marketplace_agent_v5_memories"("subject_type", "subject_id");

CREATE TABLE "marketplace_agent_v5_decision_logs" (
    "id" TEXT NOT NULL,
    "agent_kind" VARCHAR(32) NOT NULL,
    "subject_type" VARCHAR(32),
    "subject_id" VARCHAR(64),
    "decision_type" VARCHAR(64) NOT NULL,
    "input_json" JSONB,
    "output_json" JSONB,
    "reasoning" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION,
    "data_used_summary" TEXT,
    "requires_approval" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketplace_agent_v5_decision_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "marketplace_agent_v5_decision_logs_agent_kind_created_at_idx" ON "marketplace_agent_v5_decision_logs"("agent_kind", "created_at");
CREATE INDEX "marketplace_agent_v5_decision_logs_subject_type_subject_id_idx" ON "marketplace_agent_v5_decision_logs"("subject_type", "subject_id");
