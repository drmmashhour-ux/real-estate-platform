-- Append-only timeline for audits / replay (SYBNB ops).

CREATE TABLE "syria_event_timeline" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actor_id" TEXT,
    "actor_role" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "syria_event_timeline_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "syria_event_timeline_entity_type_entity_id_idx" ON "syria_event_timeline" ("entity_type", "entity_id");
CREATE INDEX "syria_event_timeline_action_idx" ON "syria_event_timeline" ("action");
CREATE INDEX "syria_event_timeline_actor_id_idx" ON "syria_event_timeline" ("actor_id");
CREATE INDEX "syria_event_timeline_created_at_idx" ON "syria_event_timeline" ("created_at");
