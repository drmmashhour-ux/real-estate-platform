-- Order 41: support ILIKE on title + city filters for /api/search/suggest (B-tree; complements GIN on title for token search)

CREATE INDEX IF NOT EXISTS "idx_order41_bnhub_listings_suggest_published"
  ON "bnhub_listings" ("listing_status", "city", "title")
  WHERE "listing_status" = 'PUBLISHED';
