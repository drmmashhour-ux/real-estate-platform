-- Lead: optional platform user + AI explanation JSON
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "user_id" TEXT;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "ai_explanation" JSONB;
CREATE INDEX IF NOT EXISTS "Lead_user_id_idx" ON "Lead"("user_id");
CREATE INDEX IF NOT EXISTS "Lead_email_idx" ON "Lead"("email");

ALTER TABLE "Lead" ADD CONSTRAINT "Lead_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AI activity & profiles
CREATE TABLE "ai_user_activity_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "listing_id" TEXT,
    "project_id" TEXT,
    "search_query" TEXT,
    "duration_seconds" INTEGER,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ai_user_activity_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ai_user_activity_logs_user_id_created_at_idx" ON "ai_user_activity_logs"("user_id", "created_at");
CREATE INDEX "ai_user_activity_logs_event_type_idx" ON "ai_user_activity_logs"("event_type");
ALTER TABLE "ai_user_activity_logs" ADD CONSTRAINT "ai_user_activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ai_recommendation_history" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "listing_id" TEXT,
    "source" TEXT NOT NULL,
    "rank_score" DOUBLE PRECISION,
    "explanation" TEXT,
    "presented_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clicked_at" TIMESTAMP(3),
    CONSTRAINT "ai_recommendation_history_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ai_recommendation_history_user_id_idx" ON "ai_recommendation_history"("user_id");
CREATE INDEX "ai_recommendation_history_listing_id_idx" ON "ai_recommendation_history"("listing_id");
ALTER TABLE "ai_recommendation_history" ADD CONSTRAINT "ai_recommendation_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ai_marketing_content" (
    "id" TEXT NOT NULL,
    "created_by_id" TEXT,
    "content_type" TEXT NOT NULL,
    "template_key" TEXT,
    "title" TEXT,
    "body" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ai_marketing_content_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ai_marketing_content_content_type_idx" ON "ai_marketing_content"("content_type");
ALTER TABLE "ai_marketing_content" ADD CONSTRAINT "ai_marketing_content_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "user_ai_profiles" (
    "user_id" TEXT NOT NULL,
    "behavior_lead_score" INTEGER NOT NULL DEFAULT 0,
    "behavior_tier" TEXT,
    "score_breakdown" JSONB,
    "fraud_heuristic_score" INTEGER NOT NULL DEFAULT 0,
    "ai_flags" JSONB,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "user_ai_profiles_pkey" PRIMARY KEY ("user_id")
);
ALTER TABLE "user_ai_profiles" ADD CONSTRAINT "user_ai_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ai_automation_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "broker_id" TEXT,
    "event_key" TEXT NOT NULL,
    "payload" JSONB,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ai_automation_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ai_automation_events_user_id_idx" ON "ai_automation_events"("user_id");
CREATE INDEX "ai_automation_events_broker_id_idx" ON "ai_automation_events"("broker_id");
CREATE INDEX "ai_automation_events_event_key_idx" ON "ai_automation_events"("event_key");
ALTER TABLE "ai_automation_events" ADD CONSTRAINT "ai_automation_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ai_automation_events" ADD CONSTRAINT "ai_automation_events_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
