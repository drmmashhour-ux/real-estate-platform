-- LECIPM content machine: per-style generated rows + templates + schedules

CREATE TYPE "ContentMachineStyle" AS ENUM ('price_shock', 'lifestyle', 'comparison', 'question', 'hidden_gem');
CREATE TYPE "ContentMachinePieceStatus" AS ENUM ('generated', 'video_created', 'scheduled', 'posted', 'failed');
CREATE TYPE "ContentMachineScheduleStatus" AS ENUM ('pending', 'confirmed', 'posted', 'failed', 'cancelled');

CREATE TABLE "content_templates" (
    "id" TEXT NOT NULL,
    "style" "ContentMachineStyle" NOT NULL,
    "prompt_template" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_templates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "content_templates_style_key" ON "content_templates"("style");

CREATE TABLE "generated_contents" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "style" "ContentMachineStyle" NOT NULL,
    "hook" VARCHAR(512) NOT NULL,
    "script" TEXT NOT NULL,
    "caption" TEXT NOT NULL,
    "hashtags_json" JSONB NOT NULL,
    "status" "ContentMachinePieceStatus" NOT NULL DEFAULT 'generated',
    "video_url" TEXT,
    "source" VARCHAR(24) NOT NULL DEFAULT 'openai',
    "error_message" TEXT,
    "views" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "metrics_synced_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "generated_contents_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "generated_contents_listing_id_created_at_idx" ON "generated_contents"("listing_id", "created_at" DESC);
CREATE INDEX "generated_contents_style_status_idx" ON "generated_contents"("style", "status");

ALTER TABLE "generated_contents" ADD CONSTRAINT "generated_contents_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "content_schedules" (
    "id" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "platform" VARCHAR(24) NOT NULL,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "status" "ContentMachineScheduleStatus" NOT NULL DEFAULT 'pending',
    "external_id" VARCHAR(256),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_schedules_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "content_schedules_scheduled_at_idx" ON "content_schedules"("scheduled_at");
CREATE INDEX "content_schedules_content_id_idx" ON "content_schedules"("content_id");

ALTER TABLE "content_schedules" ADD CONSTRAINT "content_schedules_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "generated_contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
