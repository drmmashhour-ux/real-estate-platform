-- ORDER SYBNB-113 — dedupe contact taps by IP hash per listing/channel/day
CREATE TABLE "syria_listing_contact_dedupe" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "ip_hash" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "day_utc" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "syria_listing_contact_dedupe_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "syria_listing_contact_dedupe_property_id_ip_hash_channel_day_utc_key" ON "syria_listing_contact_dedupe"("property_id", "ip_hash", "channel", "day_utc");

CREATE INDEX "syria_listing_contact_dedupe_property_id_idx" ON "syria_listing_contact_dedupe"("property_id");
