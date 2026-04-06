-- Growth engine: programmatic SEO content for city intent pages

CREATE TABLE "seo_page_contents" (
    "id" TEXT NOT NULL,
    "city_slug" TEXT NOT NULL,
    "page_kind" TEXT NOT NULL,
    "block_best_properties" TEXT NOT NULL,
    "block_top_investment" TEXT NOT NULL,
    "block_rent_vs_buy" TEXT NOT NULL,
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "generated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "seo_page_contents_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uq_seo_page_content_city_kind" ON "seo_page_contents"("city_slug", "page_kind");

CREATE INDEX "seo_page_contents_city_slug_idx" ON "seo_page_contents"("city_slug");
