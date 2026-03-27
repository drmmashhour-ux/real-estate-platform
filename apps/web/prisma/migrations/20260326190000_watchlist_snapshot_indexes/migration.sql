CREATE INDEX IF NOT EXISTS "idx_watchlist_snapshots_user_listing"
  ON "watchlist_snapshots" ("user_id", "listing_id");

CREATE INDEX IF NOT EXISTS "idx_watchlist_snapshots_listing_id"
  ON "watchlist_snapshots" ("listing_id");

CREATE INDEX IF NOT EXISTS "idx_watchlist_snapshots_created_at_desc"
  ON "watchlist_snapshots" ("created_at" DESC);
