-- BNHUB auto TikTok / video / scheduler pipeline output
CREATE TABLE "content_generated" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "trigger" VARCHAR(32) NOT NULL,
    "scripts_json" JSONB NOT NULL,
    "captions_json" JSONB NOT NULL,
    "hashtags_json" JSONB NOT NULL,
    "generation_source" VARCHAR(32) NOT NULL DEFAULT 'openai',
    "video_tool" VARCHAR(24),
    "video_payload_json" JSONB,
    "video_url" TEXT,
    "video_style" VARCHAR(48) NOT NULL DEFAULT 'short_form_vertical',
    "primary_script_json" JSONB,
    "published_caption" TEXT,
    "scheduler_provider" VARCHAR(24),
    "scheduled_for" TIMESTAMP(3),
    "scheduler_external_id" VARCHAR(128),
    "metrics_views" INTEGER,
    "metrics_clicks" INTEGER,
    "metrics_conversions" INTEGER,
    "metrics_synced_at" TIMESTAMP(3),
    "pipeline_status" VARCHAR(32) NOT NULL DEFAULT 'pending',
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_generated_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "content_generated_listing_id_created_at_idx" ON "content_generated" ("listing_id", "created_at" DESC);
CREATE INDEX "content_generated_pipeline_status_idx" ON "content_generated" ("pipeline_status");

ALTER TABLE "content_generated" ADD CONSTRAINT "content_generated_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
