CREATE INDEX IF NOT EXISTS "idx_watchlist_alerts_user_id"
  ON "watchlist_alerts" ("user_id");

CREATE INDEX IF NOT EXISTS "idx_watchlist_alerts_listing_id"
  ON "watchlist_alerts" ("listing_id");

CREATE INDEX IF NOT EXISTS "idx_watchlist_alerts_status"
  ON "watchlist_alerts" ("status");

CREATE INDEX IF NOT EXISTS "idx_watchlist_alerts_created_at_desc"
  ON "watchlist_alerts" ("created_at" DESC);

CREATE INDEX IF NOT EXISTS "idx_watchlist_alerts_alert_type"
  ON "watchlist_alerts" ("alert_type");
