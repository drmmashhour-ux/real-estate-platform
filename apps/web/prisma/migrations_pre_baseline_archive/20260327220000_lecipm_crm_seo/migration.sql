-- LECIPM elite CRM scores on leads + SEO blog posts.

ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "lecipm_lead_score" INTEGER;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "lecipm_deal_quality_score" INTEGER;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "lecipm_trust_score" INTEGER;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "lecipm_urgency_score" INTEGER;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "lecipm_crm_stage" TEXT DEFAULT 'new_lead';
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "lecipm_scores_computed_at" TIMESTAMPTZ(6);

CREATE INDEX IF NOT EXISTS "Lead_lecipm_lead_score_idx" ON "Lead"("lecipm_lead_score");
CREATE INDEX IF NOT EXISTS "Lead_lecipm_crm_stage_idx" ON "Lead"("lecipm_crm_stage");

CREATE TABLE "seo_blog_posts" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "excerpt" TEXT,
    "city" TEXT,
    "keywords" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "published_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "seo_blog_posts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "seo_blog_posts_slug_key" ON "seo_blog_posts"("slug");
CREATE INDEX "seo_blog_posts_published_at_idx" ON "seo_blog_posts"("published_at");
