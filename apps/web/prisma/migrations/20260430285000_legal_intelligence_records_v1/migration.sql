-- Legal Intelligence Phase 4 — audit-friendly signal snapshots (metadata only).

CREATE TABLE IF NOT EXISTS "legal_intelligence_records" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "signal_type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "legal_intelligence_records_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "legal_intelligence_records_entity_type_entity_id_idx" ON "legal_intelligence_records" ("entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS "legal_intelligence_records_signal_type_idx" ON "legal_intelligence_records" ("signal_type");
CREATE INDEX IF NOT EXISTS "legal_intelligence_records_created_at_idx" ON "legal_intelligence_records" ("created_at");
