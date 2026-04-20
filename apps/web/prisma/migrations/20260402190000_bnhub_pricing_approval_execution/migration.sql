-- Pricing approval modes, suggestion workflow, append-only execution audit.

ALTER TABLE "bnhub_listings" ADD COLUMN "pricing_mode" VARCHAR(32) NOT NULL DEFAULT 'MANUAL';
ALTER TABLE "bnhub_listings" ADD COLUMN "auto_apply_max_change" DOUBLE PRECISION;

ALTER TABLE "bnhub_pricing_suggestions" ADD COLUMN "status" VARCHAR(24) NOT NULL DEFAULT 'pending';
ALTER TABLE "bnhub_pricing_suggestions" ADD COLUMN "applied_at" TIMESTAMP(3);

CREATE INDEX "bnhub_pricing_suggestions_listing_id_status_idx" ON "bnhub_pricing_suggestions"("listing_id", "status");

CREATE TABLE "bnhub_pricing_execution_logs" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "old_price" DOUBLE PRECISION NOT NULL,
    "new_price" DOUBLE PRECISION NOT NULL,
    "mode" VARCHAR(32) NOT NULL,
    "status" VARCHAR(24) NOT NULL,
    "reason" TEXT,
    "suggestion_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bnhub_pricing_execution_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "bnhub_pricing_execution_logs_listing_id_created_at_idx" ON "bnhub_pricing_execution_logs"("listing_id", "created_at");

ALTER TABLE "bnhub_pricing_execution_logs" ADD CONSTRAINT "bnhub_pricing_execution_logs_listing_id_fkey"
  FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
