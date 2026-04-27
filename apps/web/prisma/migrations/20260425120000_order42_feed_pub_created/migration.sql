-- Order 42 — feed: published listings by recency (complements `@@index` on ShortTermListing).
CREATE INDEX IF NOT EXISTS "idx_bnhub_listings_pub_created_feed" ON "bnhub_listings" ("listingStatus", "created_at" DESC);
