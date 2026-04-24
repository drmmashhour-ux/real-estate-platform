-- LECIPM personalized recommendations — engagement + audit (additive)

CREATE TABLE "lecipm_personalized_recommendation_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "mode" VARCHAR(24) NOT NULL,
    "event_kind" VARCHAR(48) NOT NULL,
    "entity_type" VARCHAR(32),
    "entity_id" VARCHAR(64),
    "recommendation_score" DOUBLE PRECISION,
    "explanation_user_safe" TEXT,
    "factors_json" JSONB,
    "session_id" VARCHAR(96),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lecipm_personalized_recommendation_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lecipm_personalized_recommendation_events_user_id_created_at_idx" ON "lecipm_personalized_recommendation_events"("user_id", "created_at" DESC);

CREATE INDEX "lecipm_personalized_recommendation_events_user_id_event_kind_idx" ON "lecipm_personalized_recommendation_events"("user_id", "event_kind");

ALTER TABLE "lecipm_personalized_recommendation_events" ADD CONSTRAINT "lecipm_personalized_recommendation_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
