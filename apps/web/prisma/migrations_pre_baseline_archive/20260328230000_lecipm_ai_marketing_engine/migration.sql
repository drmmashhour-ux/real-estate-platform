-- LECIPM AI marketing engine: persisted generated content + performance counters

CREATE TABLE "lecipm_marketing_engine_content" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "topic_key" TEXT,
    "listing_id" TEXT,
    "city_slug" TEXT,
    "scheduled_for" TIMESTAMPTZ(6),
    "published_at" TIMESTAMPTZ(6),
    "external_post_id" TEXT,
    "blog_slug" TEXT,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "engagements" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "optimization_meta" JSONB,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "lecipm_marketing_engine_content_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_marketing_engine_content_type_status" ON "lecipm_marketing_engine_content"("type", "status");

CREATE INDEX "idx_marketing_engine_content_platform" ON "lecipm_marketing_engine_content"("platform");

CREATE INDEX "idx_marketing_engine_content_created" ON "lecipm_marketing_engine_content"("created_at");
