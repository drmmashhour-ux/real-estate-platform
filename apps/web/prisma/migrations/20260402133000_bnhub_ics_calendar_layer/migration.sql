-- BNHub ICS calendar layer: token export feed, import sources, external events, sync logs

CREATE TABLE "listing_ics_feeds" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "token" VARCHAR(128) NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listing_ics_feeds_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "listing_ics_feeds_listing_id_key" ON "listing_ics_feeds"("listing_id");
CREATE UNIQUE INDEX "listing_ics_feeds_token_key" ON "listing_ics_feeds"("token");

ALTER TABLE "listing_ics_feeds" ADD CONSTRAINT "listing_ics_feeds_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "listing_ics_imports" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "source_name" VARCHAR(128) NOT NULL,
    "ics_url" TEXT NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "last_synced_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listing_ics_imports_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "listing_ics_imports_listing_id_idx" ON "listing_ics_imports"("listing_id");

ALTER TABLE "listing_ics_imports" ADD CONSTRAINT "listing_ics_imports_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "external_calendar_events" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "import_id" TEXT,
    "external_uid" VARCHAR(512) NOT NULL,
    "title" VARCHAR(500),
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "status" VARCHAR(32) NOT NULL DEFAULT 'blocked',
    "source_name" VARCHAR(128),
    "raw_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "external_calendar_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "external_calendar_events_listing_id_external_uid_key" ON "external_calendar_events"("listing_id", "external_uid");
CREATE INDEX "external_calendar_events_listing_id_idx" ON "external_calendar_events"("listing_id");
CREATE INDEX "external_calendar_events_import_id_idx" ON "external_calendar_events"("import_id");

ALTER TABLE "external_calendar_events" ADD CONSTRAINT "external_calendar_events_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "external_calendar_events" ADD CONSTRAINT "external_calendar_events_import_id_fkey" FOREIGN KEY ("import_id") REFERENCES "listing_ics_imports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "calendar_sync_logs" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT,
    "import_id" TEXT,
    "direction" VARCHAR(16) NOT NULL,
    "status" VARCHAR(16) NOT NULL,
    "message" TEXT,
    "meta" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calendar_sync_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "calendar_sync_logs_listing_id_idx" ON "calendar_sync_logs"("listing_id");
CREATE INDEX "calendar_sync_logs_import_id_idx" ON "calendar_sync_logs"("import_id");
CREATE INDEX "calendar_sync_logs_created_at_idx" ON "calendar_sync_logs"("created_at");

ALTER TABLE "calendar_sync_logs" ADD CONSTRAINT "calendar_sync_logs_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "calendar_sync_logs" ADD CONSTRAINT "calendar_sync_logs_import_id_fkey" FOREIGN KEY ("import_id") REFERENCES "listing_ics_imports"("id") ON DELETE SET NULL ON UPDATE CASCADE;
