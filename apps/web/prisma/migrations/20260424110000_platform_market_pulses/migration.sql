CREATE TABLE IF NOT EXISTS "platform_market_pulses" (
    "id" TEXT NOT NULL,
    "snapshot_date" TIMESTAMPTZ(6) NOT NULL,
    "visitors_count" INTEGER,
    "reservations_count" INTEGER,
    "listings_count" INTEGER,
    "sold_count" INTEGER,
    "deals_detected" INTEGER,
    "buy_box_matches" INTEGER,
    "source" VARCHAR(24) NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_market_pulses_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "platform_market_pulses_date_source_idx" ON "platform_market_pulses"("snapshot_date", "source");
CREATE INDEX IF NOT EXISTS "platform_market_pulses_created_at_desc_idx" ON "platform_market_pulses"("created_at" DESC);
