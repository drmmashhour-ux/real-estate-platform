-- Monitoring: saved searches, polymorphic watchlist bookmarks, alert center inbox, run history.

CREATE TABLE IF NOT EXISTS "monitoring_saved_searches" (
    "id" TEXT NOT NULL,
    "owner_type" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "search_type" TEXT NOT NULL,
    "city" TEXT,
    "province" TEXT DEFAULT 'QC',
    "property_type" TEXT,
    "min_price_cents" INTEGER,
    "max_price_cents" INTEGER,
    "min_cap_rate" DOUBLE PRECISION,
    "min_roi" DOUBLE PRECISION,
    "min_cashflow_cents" INTEGER,
    "min_dscr" DOUBLE PRECISION,
    "required_zone" TEXT,
    "bedrooms" INTEGER,
    "bathrooms" DOUBLE PRECISION,
    "min_area_sqft" DOUBLE PRECISION,
    "max_area_sqft" DOUBLE PRECISION,
    "filters" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "monitoring_saved_searches_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_monitoring_saved_searches_owner_active" ON "monitoring_saved_searches"("owner_type", "owner_id", "active");

CREATE TABLE IF NOT EXISTS "monitoring_saved_search_runs" (
    "id" TEXT NOT NULL,
    "saved_search_id" TEXT NOT NULL,
    "result_count" INTEGER NOT NULL,
    "new_result_count" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "monitoring_saved_search_runs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_monitoring_saved_search_runs_search_created" ON "monitoring_saved_search_runs"("saved_search_id", "created_at" DESC);

ALTER TABLE "monitoring_saved_search_runs" ADD CONSTRAINT "monitoring_saved_search_runs_saved_search_id_fkey" FOREIGN KEY ("saved_search_id") REFERENCES "monitoring_saved_searches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "monitoring_watchlist_items" (
    "id" TEXT NOT NULL,
    "owner_type" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "watch_type" TEXT NOT NULL,
    "reference_id" TEXT NOT NULL,
    "title" TEXT,
    "city" TEXT,
    "current_score" DOUBLE PRECISION,
    "last_price_cents" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "monitoring_watchlist_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_monitoring_watchlist_items_owner" ON "monitoring_watchlist_items"("owner_type", "owner_id");
CREATE INDEX IF NOT EXISTS "idx_monitoring_watchlist_items_reference" ON "monitoring_watchlist_items"("reference_id");

CREATE TABLE IF NOT EXISTS "alert_center_items" (
    "id" TEXT NOT NULL,
    "owner_type" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "alert_type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "reference_type" TEXT,
    "reference_id" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alert_center_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_alert_center_items_owner_archived" ON "alert_center_items"("owner_type", "owner_id", "archived");
