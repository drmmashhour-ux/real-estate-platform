-- Order 34: autonomous pricing execution audit + rollback support.
CREATE TABLE "pricing_execution_logs" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "old_price" DOUBLE PRECISION NOT NULL,
    "new_price" DOUBLE PRECISION NOT NULL,
    "adjustment_pct" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "source" VARCHAR(32) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pricing_execution_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "pricing_execution_logs_listing_id_created_at_idx" ON "pricing_execution_logs"("listing_id", "created_at");
