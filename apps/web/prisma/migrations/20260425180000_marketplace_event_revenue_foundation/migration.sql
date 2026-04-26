-- Order 29: real-time event tracking foundation (append-only).
-- Order 31: revenue line logging (shadow ledger; does not replace Stripe/payment truth).

CREATE TABLE "marketplace_events" (
    "id" TEXT NOT NULL,
    "event" VARCHAR(128) NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "marketplace_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "marketplace_events_event_created_at_idx" ON "marketplace_events"("event", "created_at");

CREATE TABLE "marketplace_revenue_entries" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "fee" DOUBLE PRECISION NOT NULL,
    "host_payout" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "marketplace_revenue_entries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "marketplace_revenue_entries_listing_created_idx" ON "marketplace_revenue_entries"("listing_id", "created_at");
