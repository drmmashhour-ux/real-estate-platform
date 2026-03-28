-- LECIPM monopoly mode: expansion registry + competitor snapshots

CREATE TABLE "monopoly_expansion_cities" (
    "id" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "seo_path" TEXT,
    "campaigns_enabled" BOOLEAN NOT NULL DEFAULT true,
    "launched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "monopoly_expansion_cities_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "monopoly_expansion_cities_slug_key" ON "monopoly_expansion_cities"("slug");
CREATE INDEX "monopoly_expansion_cities_launched_at_idx" ON "monopoly_expansion_cities"("launched_at");

CREATE TABLE "monopoly_competitor_snapshots" (
    "id" TEXT NOT NULL,
    "city_slug" TEXT NOT NULL,
    "competitor_key" TEXT NOT NULL,
    "platform_listing_count" INTEGER,
    "competitor_estimate" INTEGER,
    "avg_price_cents_ours" INTEGER,
    "avg_price_cents_theirs" INTEGER,
    "feature_gap_json" JSONB,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "monopoly_competitor_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "monopoly_competitor_snapshots_city_slug_recorded_at_idx" ON "monopoly_competitor_snapshots"("city_slug", "recorded_at");
