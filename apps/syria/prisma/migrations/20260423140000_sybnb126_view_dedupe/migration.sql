-- ORDER SYBNB-126 — view deduplication + unique viewer counts

ALTER TABLE "syria_properties" ADD COLUMN IF NOT EXISTS "unique_views" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "syria_listing_view_visits" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "viewer_key" VARCHAR(160) NOT NULL,
    "last_seen_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "syria_listing_view_visits_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "syria_listing_view_visits_property_id_viewer_key_key" ON "syria_listing_view_visits"("property_id", "viewer_key");

CREATE INDEX IF NOT EXISTS "syria_listing_view_visits_property_id_idx" ON "syria_listing_view_visits"("property_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'syria_listing_view_visits_property_id_fkey'
  ) THEN
    ALTER TABLE "syria_listing_view_visits"
      ADD CONSTRAINT "syria_listing_view_visits_property_id_fkey"
      FOREIGN KEY ("property_id") REFERENCES "syria_properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
