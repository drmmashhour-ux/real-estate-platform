-- Investor metrics — daily KPI snapshots

CREATE TABLE "investor_metric_snapshots" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "total_users" INTEGER NOT NULL,
    "active_users" INTEGER NOT NULL,
    "total_listings" INTEGER NOT NULL,
    "bookings" INTEGER NOT NULL DEFAULT 0,
    "revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "conversion_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "investor_metric_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "investor_metric_snapshots_date_key" ON "investor_metric_snapshots"("date");
CREATE INDEX "investor_metric_snapshots_date_idx" ON "investor_metric_snapshots"("date");
