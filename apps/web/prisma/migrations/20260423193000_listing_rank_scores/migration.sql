-- Explainable marketplace ranking computation log (per batch / context hash).

CREATE TABLE "listing_rank_scores" (
    "id" TEXT NOT NULL,
    "listing_id" VARCHAR(64) NOT NULL,
    "listing_type" VARCHAR(16) NOT NULL DEFAULT 'bnhub',
    "total_score" DOUBLE PRECISION NOT NULL,
    "breakdown_json" JSONB NOT NULL,
    "ranking_context_hash" VARCHAR(64) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listing_rank_scores_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "listing_rank_scores_listing_id_created_at_idx" ON "listing_rank_scores"("listing_id", "created_at" DESC);
CREATE INDEX "listing_rank_scores_ranking_context_hash_created_at_idx" ON "listing_rank_scores"("ranking_context_hash", "created_at" DESC);
