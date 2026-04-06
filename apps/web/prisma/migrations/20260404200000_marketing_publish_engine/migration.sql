-- Marketing publish pipeline: statuses, channel targets, audit jobs

CREATE TYPE "MarketingPublishChannel" AS ENUM ('EMAIL', 'X', 'LINKEDIN', 'INSTAGRAM', 'TIKTOK');

CREATE TYPE "MarketingPublishJobStatus" AS ENUM ('SCHEDULED', 'RUNNING', 'SUCCESS', 'FAILED', 'DRY_RUN');

ALTER TYPE "MarketingContentStatus" ADD VALUE 'PUBLISHING';
ALTER TYPE "MarketingContentStatus" ADD VALUE 'FAILED';

ALTER TABLE "marketing_content" ADD COLUMN "publish_channel" "MarketingPublishChannel",
ADD COLUMN "publish_target_id" TEXT,
ADD COLUMN "publish_dry_run" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE "marketing_publish_jobs" (
    "id" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "channel" "MarketingPublishChannel" NOT NULL,
    "status" "MarketingPublishJobStatus" NOT NULL,
    "scheduled_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "finished_at" TIMESTAMP(3),
    "external_post_id" TEXT,
    "error_message" TEXT,
    "response_summary" TEXT,
    "dry_run" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketing_publish_jobs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "marketing_publish_jobs_content_id_idx" ON "marketing_publish_jobs"("content_id");

CREATE INDEX "marketing_publish_jobs_created_at_idx" ON "marketing_publish_jobs"("created_at");

CREATE INDEX "marketing_publish_jobs_status_idx" ON "marketing_publish_jobs"("status");

ALTER TABLE "marketing_publish_jobs" ADD CONSTRAINT "marketing_publish_jobs_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "marketing_content"("id") ON DELETE CASCADE ON UPDATE CASCADE;
