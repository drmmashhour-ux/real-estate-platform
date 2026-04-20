-- BNHub revenue KPI snapshots + dashboard event log (distinct from SaaS `revenue_snapshots`).

CREATE TABLE "bnhub_revenue_metric_snapshots" (
    "id" TEXT NOT NULL,
    "scope_type" VARCHAR(24) NOT NULL,
    "scope_id" TEXT NOT NULL,
    "snapshot_date" DATE NOT NULL,
    "gross_revenue" DOUBLE PRECISION NOT NULL,
    "booking_count" INTEGER NOT NULL,
    "occupied_nights" INTEGER NOT NULL,
    "available_nights" INTEGER NOT NULL,
    "occupancy_rate" DOUBLE PRECISION NOT NULL,
    "adr" DOUBLE PRECISION NOT NULL,
    "revpar" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bnhub_revenue_metric_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "bnhub_revenue_metric_snapshots_scope_type_scope_id_snapshot_date_key"
  ON "bnhub_revenue_metric_snapshots"("scope_type", "scope_id", "snapshot_date");

CREATE INDEX "bnhub_revenue_metric_snapshots_scope_type_scope_id_snapshot_date_idx"
  ON "bnhub_revenue_metric_snapshots"("scope_type", "scope_id", "snapshot_date");

CREATE TABLE "bnhub_dashboard_event_logs" (
    "id" TEXT NOT NULL,
    "type" VARCHAR(48) NOT NULL,
    "scope_type" VARCHAR(24),
    "scope_id" TEXT,
    "status" VARCHAR(24) NOT NULL,
    "message" TEXT,
    "meta" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bnhub_dashboard_event_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "bnhub_dashboard_event_logs_type_created_at_idx"
  ON "bnhub_dashboard_event_logs"("type", "created_at");
