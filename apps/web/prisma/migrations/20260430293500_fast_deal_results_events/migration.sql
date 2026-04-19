-- Fast Deal Engine results loop — measurement + operator attribution only (no automation).
CREATE TABLE "fast_deal_source_events" (
    "id" TEXT NOT NULL,
    "source_type" VARCHAR(32) NOT NULL,
    "source_sub_type" VARCHAR(80) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata_json" JSONB,

    CONSTRAINT "fast_deal_source_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "fast_deal_source_events_source_type_created_at_idx" ON "fast_deal_source_events"("source_type", "created_at");
CREATE INDEX "fast_deal_source_events_source_sub_type_created_at_idx" ON "fast_deal_source_events"("source_sub_type", "created_at");

CREATE TABLE "fast_deal_outcomes" (
    "id" TEXT NOT NULL,
    "source_event_id" TEXT,
    "lead_id" TEXT,
    "broker_id" TEXT,
    "outcome_type" VARCHAR(48) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata_json" JSONB,

    CONSTRAINT "fast_deal_outcomes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "fast_deal_outcomes_outcome_type_created_at_idx" ON "fast_deal_outcomes"("outcome_type", "created_at");
CREATE INDEX "fast_deal_outcomes_lead_id_idx" ON "fast_deal_outcomes"("lead_id");
