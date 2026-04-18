-- Additive: append-only reputation ranking audit rows (LECIPM Reputation + Ranking Engine v1).

CREATE TABLE "ranking_snapshots" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "ranking_score" DOUBLE PRECISION NOT NULL,
    "factors" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ranking_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ranking_snapshots_listing_id_created_at_idx" ON "ranking_snapshots"("listing_id", "created_at");

ALTER TABLE "ranking_snapshots" ADD CONSTRAINT "ranking_snapshots_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "short_term_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
