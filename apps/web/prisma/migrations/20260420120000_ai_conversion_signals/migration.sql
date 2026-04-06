-- BNHub guest conversion funnel — explicit events (LECIPM Manager).

CREATE TABLE "ai_conversion_signals" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "listing_id" TEXT NOT NULL,
    "guest_id" TEXT,
    "event_type" TEXT NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "ai_conversion_signals_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ai_conversion_signals_listing_id_created_at_idx" ON "ai_conversion_signals"("listing_id", "created_at");

CREATE INDEX "ai_conversion_signals_guest_id_created_at_idx" ON "ai_conversion_signals"("guest_id", "created_at");

CREATE INDEX "ai_conversion_signals_event_type_created_at_idx" ON "ai_conversion_signals"("event_type", "created_at");

ALTER TABLE "ai_conversion_signals" ADD CONSTRAINT "ai_conversion_signals_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ai_conversion_signals" ADD CONSTRAINT "ai_conversion_signals_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
