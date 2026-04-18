-- BNHub ShortTermListing: denormalized ranking cache (parity with FSBO marketplace browse).
ALTER TABLE "bnhub_listings" ADD COLUMN IF NOT EXISTS "ranking_total_score_cache" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "bnhub_listings" ADD COLUMN IF NOT EXISTS "ranking_performance_band" VARCHAR(32);
ALTER TABLE "bnhub_listings" ADD COLUMN IF NOT EXISTS "ranking_cached_at" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "bnhub_listings_ranking_total_score_cache_idx" ON "bnhub_listings" ("ranking_total_score_cache" DESC);
