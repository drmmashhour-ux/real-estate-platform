-- BNHub Channel Manager & OTA Sync (iCal MVP + OTA-ready schema)

-- Extend OTA platform enum (PostgreSQL: additive values)
ALTER TYPE "BnhubChannelPlatform" ADD VALUE 'VRBO';
ALTER TYPE "BnhubChannelPlatform" ADD VALUE 'DIRECT';
ALTER TYPE "BnhubChannelPlatform" ADD VALUE 'OTHER';

CREATE TYPE "BnhubChannelConnectionType" AS ENUM ('ICAL', 'API');
CREATE TYPE "BnhubChannelConnectionStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ERROR');
CREATE TYPE "BnhubChannelListingMapStatus" AS ENUM ('LINKED', 'PENDING', 'ERROR');
CREATE TYPE "BnhubChannelEventSource" AS ENUM ('BNHUB', 'EXTERNAL');
CREATE TYPE "BnhubChannelEventKind" AS ENUM ('RESERVATION', 'BLOCK', 'AVAILABILITY_UPDATE');
CREATE TYPE "BnhubOtaSyncType" AS ENUM ('IMPORT', 'EXPORT');
CREATE TYPE "BnhubOtaSyncResultStatus" AS ENUM ('SUCCESS', 'FAILED');

ALTER TABLE "bnhub_listings" ADD COLUMN IF NOT EXISTS "channel_ical_export_token" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "bnhub_listings_channel_ical_export_token_key" ON "bnhub_listings" ("channel_ical_export_token") WHERE "channel_ical_export_token" IS NOT NULL;

CREATE TABLE "bnhub_channel_connections" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "platform" "BnhubChannelPlatform" NOT NULL,
    "connection_type" "BnhubChannelConnectionType" NOT NULL,
    "external_listing_id" TEXT,
    "ical_import_url" TEXT,
    "ical_export_url" TEXT,
    "status" "BnhubChannelConnectionStatus" NOT NULL DEFAULT 'ACTIVE',
    "last_sync_at" TIMESTAMP(3),
    "sync_frequency_minutes" INTEGER NOT NULL DEFAULT 30,
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bnhub_channel_connections_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bnhub_channel_mappings" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "channel_connection_id" TEXT NOT NULL,
    "external_listing_ref" TEXT NOT NULL,
    "mapping_status" "BnhubChannelListingMapStatus" NOT NULL DEFAULT 'LINKED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bnhub_channel_mappings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "bnhub_channel_mappings_listing_connection_key" ON "bnhub_channel_mappings" ("listing_id", "channel_connection_id");
CREATE INDEX "bnhub_channel_mappings_channel_connection_id_idx" ON "bnhub_channel_mappings" ("channel_connection_id");
CREATE INDEX "bnhub_channel_mappings_listing_id_idx" ON "bnhub_channel_mappings" ("listing_id");

CREATE TABLE "bnhub_channel_events" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "channel_connection_id" TEXT,
    "source" "BnhubChannelEventSource" NOT NULL,
    "platform" "BnhubChannelPlatform" NOT NULL,
    "external_event_id" TEXT,
    "event_type" "BnhubChannelEventKind" NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "guest_name" TEXT,
    "metadata_json" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bnhub_channel_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "bnhub_channel_events_listing_id_idx" ON "bnhub_channel_events" ("listing_id");
CREATE INDEX "bnhub_channel_events_channel_connection_id_idx" ON "bnhub_channel_events" ("channel_connection_id");
CREATE INDEX "bnhub_channel_events_source_idx" ON "bnhub_channel_events" ("source");
CREATE INDEX "bnhub_channel_events_start_date_idx" ON "bnhub_channel_events" ("start_date");
CREATE INDEX "bnhub_channel_events_platform_idx" ON "bnhub_channel_events" ("platform");

CREATE TABLE "bnhub_sync_logs" (
    "id" TEXT NOT NULL,
    "connection_id" TEXT NOT NULL,
    "listing_id" TEXT,
    "sync_type" "BnhubOtaSyncType" NOT NULL,
    "status" "BnhubOtaSyncResultStatus" NOT NULL,
    "message" TEXT,
    "payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bnhub_sync_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "bnhub_sync_logs_connection_id_idx" ON "bnhub_sync_logs" ("connection_id");
CREATE INDEX "bnhub_sync_logs_listing_id_idx" ON "bnhub_sync_logs" ("listing_id");
CREATE INDEX "bnhub_sync_logs_created_at_idx" ON "bnhub_sync_logs" ("created_at");
CREATE INDEX "bnhub_sync_logs_status_idx" ON "bnhub_sync_logs" ("status");

CREATE INDEX "bnhub_channel_connections_user_id_idx" ON "bnhub_channel_connections" ("user_id");
CREATE INDEX "bnhub_channel_connections_platform_idx" ON "bnhub_channel_connections" ("platform");
CREATE INDEX "bnhub_channel_connections_status_idx" ON "bnhub_channel_connections" ("status");
CREATE INDEX "bnhub_channel_connections_last_sync_at_idx" ON "bnhub_channel_connections" ("last_sync_at");

ALTER TABLE "bnhub_channel_connections" ADD CONSTRAINT "bnhub_channel_connections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bnhub_channel_mappings" ADD CONSTRAINT "bnhub_channel_mappings_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bnhub_channel_mappings" ADD CONSTRAINT "bnhub_channel_mappings_channel_connection_id_fkey" FOREIGN KEY ("channel_connection_id") REFERENCES "bnhub_channel_connections" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bnhub_channel_events" ADD CONSTRAINT "bnhub_channel_events_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bnhub_channel_events" ADD CONSTRAINT "bnhub_channel_events_channel_connection_id_fkey" FOREIGN KEY ("channel_connection_id") REFERENCES "bnhub_channel_connections" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "bnhub_sync_logs" ADD CONSTRAINT "bnhub_sync_logs_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "bnhub_channel_connections" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bnhub_sync_logs" ADD CONSTRAINT "bnhub_sync_logs_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
