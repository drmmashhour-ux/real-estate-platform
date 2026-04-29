-- Prerequisite for growth_autopilot_v2: table was relied on via ALTER without an earlier CREATE in the chain (schema.prisma @@map seo_page_opportunities).
CREATE TABLE IF NOT EXISTS "seo_page_opportunities" (
  "id" TEXT NOT NULL,
  "slug" VARCHAR(256) NOT NULL,
  "page_type" VARCHAR(64) NOT NULL,
  "city" VARCHAR(128),
  "neighborhood" VARCHAR(128),
  "property_type" VARCHAR(64),
  "transaction_type" VARCHAR(24),
  "budget_min_cents" INTEGER,
  "budget_max_cents" INTEGER,
  "bedroom_count" INTEGER,
  "page_family" VARCHAR(64),
  "inventory_count" INTEGER NOT NULL DEFAULT 0,
  "opportunity_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "seo_scores_json" JSONB,
  "duplicate_risk_score" DOUBLE PRECISION,
  "last_evaluated_at" TIMESTAMP(3),
  "status" VARCHAR(24) NOT NULL DEFAULT 'candidate',
  "metadata_json" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "seo_page_opportunities_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "seo_page_opportunities_slug_key" ON "seo_page_opportunities"("slug");
CREATE INDEX IF NOT EXISTS "seo_page_opportunities_inventory_count_idx" ON "seo_page_opportunities"("inventory_count");
CREATE INDEX IF NOT EXISTS "seo_page_opportunities_opportunity_score_idx" ON "seo_page_opportunities"("opportunity_score");
CREATE INDEX IF NOT EXISTS "seo_page_opportunities_page_family_idx" ON "seo_page_opportunities"("page_family");
