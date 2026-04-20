-- Phase 4.5 Event Timeline Engine — append-only facts store

CREATE TABLE "event_records" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "actor_id" TEXT,
    "actor_type" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_records_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "event_records_entity_type_entity_id_idx" ON "event_records"("entity_type", "entity_id");
CREATE INDEX "event_records_event_type_idx" ON "event_records"("event_type");
CREATE INDEX "event_records_created_at_idx" ON "event_records"("created_at");
