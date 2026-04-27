-- SY8 feed rank: additive denormalized score for browse ordering (location + trust + booking history).

ALTER TABLE "syria_properties" ADD COLUMN IF NOT EXISTS "sy8_feed_rank_score" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS "syria_properties_sy8_feed_rank_score_created_at_idx" ON "syria_properties" ("sy8_feed_rank_score" DESC, "created_at" DESC);

UPDATE "syria_properties" p
SET "sy8_feed_rank_score" = (
  (CASE
    WHEN (
      trim(COALESCE(p."state", '')) <> '' OR trim(COALESCE(p."governorate", '')) <> ''
    ) AND trim(COALESCE(p."city", '')) <> '' THEN 3
    ELSE 0
  END)
  + (CASE WHEN trim(COALESCE(p."area", '')) <> '' THEN 2 ELSE 0 END)
  + (CASE
    WHEN p."address_details" IS NOT NULL AND trim(p."address_details") <> '' THEN 2
    ELSE 0
  END)
  + (CASE
    WHEN EXISTS (
      SELECT 1 FROM "syria_app_users" o
      WHERE o.id = p."owner_id"
        AND (o."phone_verified_at" IS NOT NULL OR o."verified_at" IS NOT NULL)
    ) THEN 3
    ELSE 0
  END)
  + (CASE
    WHEN (SELECT count(*)::int FROM "syria_bookings" b WHERE b."property_id" = p."id") > 0
    THEN 5
    ELSE 0
  END)
);
