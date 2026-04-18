-- Revenue Engine v4 — audit trail for pricing/monetization recommendations (no financial ledger).
CREATE TABLE "revenue_engine_v4_audit_logs" (
    "id" TEXT NOT NULL,
    "engine" VARCHAR(32) NOT NULL,
    "action" VARCHAR(96) NOT NULL,
    "entity_type" VARCHAR(32),
    "entity_id" VARCHAR(64),
    "input_json" JSONB,
    "output_json" JSONB,
    "confidence" DOUBLE PRECISION,
    "explanation" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "revenue_engine_v4_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "revenue_engine_v4_audit_logs_engine_created_at_idx" ON "revenue_engine_v4_audit_logs"("engine", "created_at");
CREATE INDEX "revenue_engine_v4_audit_logs_entity_type_entity_id_idx" ON "revenue_engine_v4_audit_logs"("entity_type", "entity_id");
