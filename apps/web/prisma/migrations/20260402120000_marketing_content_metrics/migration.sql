-- AI marketing storage + manual metrics

CREATE TYPE "MarketingContentType" AS ENUM ('SOCIAL_POST', 'CAPTION', 'EMAIL', 'GROWTH_IDEA');
CREATE TYPE "MarketingContentStatus" AS ENUM ('DRAFT', 'APPROVED', 'SCHEDULED', 'PUBLISHED');

CREATE TABLE "marketing_content" (
    "id" TEXT NOT NULL,
    "type" "MarketingContentType" NOT NULL,
    "content" TEXT NOT NULL,
    "content_json" JSONB,
    "platform" TEXT,
    "topic" TEXT NOT NULL,
    "tone" TEXT NOT NULL,
    "audience" TEXT NOT NULL,
    "theme" TEXT,
    "status" "MarketingContentStatus" NOT NULL DEFAULT 'DRAFT',
    "scheduled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ai_source" TEXT,
    "email_subject" TEXT,
    "email_body" TEXT,
    "email_cta" TEXT,
    "is_email_campaign" BOOLEAN NOT NULL DEFAULT false,
    "created_by_user_id" TEXT,

    CONSTRAINT "marketing_content_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "marketing_content_status_idx" ON "marketing_content"("status");
CREATE INDEX "marketing_content_type_idx" ON "marketing_content"("type");
CREATE INDEX "marketing_content_created_at_idx" ON "marketing_content"("created_at");
CREATE INDEX "marketing_content_scheduled_at_idx" ON "marketing_content"("scheduled_at");

CREATE TABLE "marketing_metrics" (
    "id" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "views" INTEGER,
    "clicks" INTEGER,
    "conversions" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketing_metrics_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "marketing_metrics_content_id_idx" ON "marketing_metrics"("content_id");
CREATE INDEX "marketing_metrics_created_at_idx" ON "marketing_metrics"("created_at");

ALTER TABLE "marketing_metrics" ADD CONSTRAINT "marketing_metrics_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "marketing_content"("id") ON DELETE CASCADE ON UPDATE CASCADE;
