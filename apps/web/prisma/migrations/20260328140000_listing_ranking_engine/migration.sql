-- LECIPM + BNHub explainable ranking: scores, configs, impression/click logs.
-- listing_id stores ShortTermListing.id / FsboListing.id (UUID/cuid text), not numeric BigInt.

CREATE TABLE "listing_ranking_scores" (
    "id" TEXT NOT NULL,
    "listing_type" VARCHAR(32) NOT NULL,
    "listing_id" VARCHAR(40) NOT NULL,
    "city" VARCHAR(128),
    "neighborhood" VARCHAR(128),
    "total_score" DOUBLE PRECISION NOT NULL,
    "relevance_score" DOUBLE PRECISION NOT NULL,
    "trust_score" DOUBLE PRECISION NOT NULL,
    "quality_score" DOUBLE PRECISION NOT NULL,
    "engagement_score" DOUBLE PRECISION NOT NULL,
    "conversion_score" DOUBLE PRECISION NOT NULL,
    "freshness_score" DOUBLE PRECISION NOT NULL,
    "host_score" DOUBLE PRECISION,
    "review_score" DOUBLE PRECISION,
    "price_competitiveness_score" DOUBLE PRECISION,
    "availability_score" DOUBLE PRECISION,
    "metadata_json" JSONB,
    "computed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listing_ranking_scores_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "listing_ranking_scores_listing_type_listing_id_key" ON "listing_ranking_scores"("listing_type", "listing_id");
CREATE INDEX "listing_ranking_scores_listing_type_city_idx" ON "listing_ranking_scores"("listing_type", "city");
CREATE INDEX "listing_ranking_scores_listing_type_total_score_idx" ON "listing_ranking_scores"("listing_type", "total_score");
CREATE INDEX "listing_ranking_scores_city_neighborhood_idx" ON "listing_ranking_scores"("city", "neighborhood");

CREATE TABLE "ranking_configs" (
    "id" TEXT NOT NULL,
    "config_key" TEXT NOT NULL,
    "listing_type" VARCHAR(32) NOT NULL,
    "weights_json" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ranking_configs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ranking_configs_config_key_key" ON "ranking_configs"("config_key");
CREATE INDEX "ranking_configs_listing_type_is_active_idx" ON "ranking_configs"("listing_type", "is_active");

CREATE TABLE "ranking_impression_logs" (
    "id" TEXT NOT NULL,
    "listing_type" VARCHAR(32) NOT NULL,
    "listing_id" VARCHAR(40) NOT NULL,
    "page_type" VARCHAR(32),
    "position" INTEGER,
    "city" VARCHAR(128),
    "user_id" TEXT,
    "session_id" VARCHAR(64),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ranking_impression_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ranking_impression_logs_listing_type_listing_id_idx" ON "ranking_impression_logs"("listing_type", "listing_id");
CREATE INDEX "ranking_impression_logs_page_type_created_at_idx" ON "ranking_impression_logs"("page_type", "created_at");
CREATE INDEX "ranking_impression_logs_city_created_at_idx" ON "ranking_impression_logs"("city", "created_at");

CREATE TABLE "ranking_click_logs" (
    "id" TEXT NOT NULL,
    "listing_type" VARCHAR(32) NOT NULL,
    "listing_id" VARCHAR(40) NOT NULL,
    "page_type" VARCHAR(32),
    "position" INTEGER,
    "user_id" TEXT,
    "session_id" VARCHAR(64),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ranking_click_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ranking_click_logs_listing_type_listing_id_idx" ON "ranking_click_logs"("listing_type", "listing_id");
CREATE INDEX "ranking_click_logs_page_type_created_at_idx" ON "ranking_click_logs"("page_type", "created_at");
