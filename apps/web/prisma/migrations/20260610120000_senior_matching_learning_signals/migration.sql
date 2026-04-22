-- Senior Living matching funnel + adaptive weights

CREATE TABLE "matching_events" (
    "id" TEXT NOT NULL,
    "user_id" VARCHAR(36),
    "residence_id" VARCHAR(36) NOT NULL,
    "event_type" VARCHAR(24) NOT NULL,
    "score_at_time" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "matching_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "matching_weights" (
    "id" TEXT NOT NULL,
    "care_weight" DOUBLE PRECISION NOT NULL DEFAULT 0.35,
    "budget_weight" DOUBLE PRECISION NOT NULL DEFAULT 0.25,
    "location_weight" DOUBLE PRECISION NOT NULL DEFAULT 0.2,
    "service_weight" DOUBLE PRECISION NOT NULL DEFAULT 0.2,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "matching_weights_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "matching_events_residence_id_event_type_created_at_idx" ON "matching_events"("residence_id", "event_type", "created_at");

CREATE INDEX "matching_events_created_at_idx" ON "matching_events"("created_at");

ALTER TABLE "matching_events" ADD CONSTRAINT "matching_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "matching_events" ADD CONSTRAINT "matching_events_residence_id_fkey" FOREIGN KEY ("residence_id") REFERENCES "senior_residences"("id") ON DELETE CASCADE ON UPDATE CASCADE;
