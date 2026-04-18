-- LECIPM Marketing System v2 — user blog + unified funnel/performance events (additive)

CREATE TYPE "MarketingBlogPostStatus" AS ENUM ('DRAFT', 'PUBLISHED');

CREATE TABLE "marketing_blog_posts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "slug" VARCHAR(200) NOT NULL,
    "content" TEXT NOT NULL,
    "cover_image_url" VARCHAR(2000),
    "status" "MarketingBlogPostStatus" NOT NULL DEFAULT 'DRAFT',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "seo_title" VARCHAR(300),
    "seo_description" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "published_at" TIMESTAMP(3),

    CONSTRAINT "marketing_blog_posts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "marketing_blog_posts_slug_key" ON "marketing_blog_posts"("slug");
CREATE INDEX "marketing_blog_posts_user_id_updated_at_idx" ON "marketing_blog_posts"("user_id", "updated_at");
CREATE INDEX "marketing_blog_posts_status_published_at_idx" ON "marketing_blog_posts"("status", "published_at");

ALTER TABLE "marketing_blog_posts" ADD CONSTRAINT "marketing_blog_posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TYPE "MarketingSystemEventCategory" AS ENUM ('FUNNEL', 'PERFORMANCE');

CREATE TABLE "marketing_system_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "category" "MarketingSystemEventCategory" NOT NULL,
    "event_key" VARCHAR(64) NOT NULL,
    "subject_type" VARCHAR(32),
    "subject_id" VARCHAR(64),
    "amount_cents" INTEGER,
    "session_id" VARCHAR(128),
    "meta" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketing_system_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "marketing_system_events_user_id_created_at_idx" ON "marketing_system_events"("user_id", "created_at");
CREATE INDEX "marketing_system_events_category_event_key_created_at_idx" ON "marketing_system_events"("category", "event_key", "created_at");
CREATE INDEX "marketing_system_events_subject_type_subject_id_created_at_idx" ON "marketing_system_events"("subject_type", "subject_id", "created_at");

ALTER TABLE "marketing_system_events" ADD CONSTRAINT "marketing_system_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
