-- SYBNB-42: Stay browse tier for hotel boost ordering (denormalized; recomputed with SY8 feed rank).
ALTER TABLE "syria_properties" ADD COLUMN IF NOT EXISTS "sybnb_browse_tier" INTEGER NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS "syria_properties_sybnb_browse_tier_sy8_feed_rank_score_idx"
  ON "syria_properties" ("sybnb_browse_tier", "sy8_feed_rank_score");

UPDATE "syria_properties" SET "sybnb_browse_tier" = CASE
  WHEN "fraud_flag" THEN 0
  WHEN "type" = 'HOTEL' AND "plan" = 'hotel_featured' AND ("listing_verified" OR "verified") THEN 4
  WHEN "plan" IN ('featured', 'premium', 'hotel_featured') THEN 3
  WHEN "listing_verified" OR "verified" THEN 2
  ELSE 1
END;
