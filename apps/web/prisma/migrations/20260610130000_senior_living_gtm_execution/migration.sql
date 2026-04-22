-- Senior Living 90-day GTM execution log (outreach, replies, onboarding, revenue)

CREATE TABLE "senior_living_gtm_execution_events" (
    "id" TEXT NOT NULL,
    "event_type" VARCHAR(40) NOT NULL,
    "operator_user_id" VARCHAR(36),
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "metadata" JSONB,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "senior_living_gtm_execution_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "senior_living_gtm_execution_events_event_type_occurred_at_idx" ON "senior_living_gtm_execution_events"("event_type", "occurred_at");

CREATE INDEX "senior_living_gtm_execution_events_occurred_at_idx" ON "senior_living_gtm_execution_events"("occurred_at");

ALTER TABLE "senior_living_gtm_execution_events" ADD CONSTRAINT "senior_living_gtm_execution_events_operator_user_id_fkey" FOREIGN KEY ("operator_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
