-- Legal Hub — imported legal records (parsed/validation payloads only; files referenced by file_id).

CREATE TABLE IF NOT EXISTS "legal_records" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "record_type" TEXT NOT NULL,
    "file_id" TEXT NOT NULL,
    "parsed_data" JSONB,
    "validation" JSONB,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "legal_records_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "legal_records_entity_idx" ON "legal_records" ("entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS "legal_records_type_idx" ON "legal_records" ("record_type");
