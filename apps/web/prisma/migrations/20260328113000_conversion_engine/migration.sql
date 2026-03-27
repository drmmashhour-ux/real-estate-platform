-- CreateTable
CREATE TABLE "conversion_profiles" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "stage" TEXT NOT NULL DEFAULT 'visitor',
  "engagement_level" INTEGER NOT NULL DEFAULT 0,
  "analyses_count" INTEGER NOT NULL DEFAULT 0,
  "high_score_views" INTEGER NOT NULL DEFAULT 0,
  "repeat_listing_view" INTEGER NOT NULL DEFAULT 0,
  "last_active_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "metadata" JSONB,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "conversion_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "conversion_profiles_user_id_key" ON "conversion_profiles"("user_id");
CREATE INDEX "idx_conversion_profile_stage" ON "conversion_profiles"("stage");
CREATE INDEX "idx_conversion_profile_last_active" ON "conversion_profiles"("last_active_at");

-- CreateTable
CREATE TABLE "conversion_automation_logs" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "trigger_type" TEXT NOT NULL,
  "channel" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'queued',
  "payload" JSONB,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "conversion_automation_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_conversion_auto_user" ON "conversion_automation_logs"("user_id");
CREATE INDEX "idx_conversion_auto_trigger_created" ON "conversion_automation_logs"("trigger_type", "created_at");
