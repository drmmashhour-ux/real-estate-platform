-- Order 79 — BNHub search: btree alignment + optional full-text on title (additive).
-- Renames legacy Prisma price index to stable ops name; adds city, rating, GIN on title.

DROP INDEX IF EXISTS "bnhub_listings_nightPriceCents_idx";

CREATE INDEX "idx_listing_price" ON "bnhub_listings"("nightPriceCents");

CREATE INDEX "idx_listing_city" ON "bnhub_listings"("city");

CREATE INDEX "idx_listing_rating" ON "bnhub_listings"("bnhub_listing_rating_average");

CREATE INDEX "idx_listing_title_search" ON "bnhub_listings" USING gin (to_tsvector('english', "title"));
