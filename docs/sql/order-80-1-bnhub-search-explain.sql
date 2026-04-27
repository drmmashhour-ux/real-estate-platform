-- Order 80.1 — validate BNHub GIN + btree search plan (dev/staging; replace bind values).
-- Expect: Bitmap Index Scan on `idx_listing_title_search` (GIN) for the tsvector match,
--        plus btree use on price/city/rating as filters apply.
--
-- Example hybrid query (matches `lib/bnhub/bnhub-listings-fts-search.ts`):

EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT l."id"::text AS id
FROM "bnhub_listings" l
WHERE l."listingStatus" = 'PUBLISHED'
  AND to_tsvector('english', l."title") @@ plainto_tsquery('english', 'condo montreal')
  AND l."nightPriceCents" BETWEEN 5000 AND 50000
  AND l."maxGuests" >= 2
  AND l."city" ILIKE '%montreal%'
ORDER BY l."id" ASC
LIMIT 20 OFFSET 0;
