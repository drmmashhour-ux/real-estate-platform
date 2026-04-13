-- Unified platform event bus + configurable automation rules (LECIPM + BNHub)

CREATE TYPE "PlatformAutonomyEventType" AS ENUM (
  'LISTING_CREATED',
  'LISTING_UPDATED',
  'BOOKING_CREATED',
  'BOOKING_ABANDONED',
  'USER_ACTIVITY'
);

CREATE TABLE "platform_autonomy_events" (
    "id" TEXT NOT NULL,
    "event_type" "PlatformAutonomyEventType" NOT NULL,
    "entity_type" VARCHAR(64),
    "entity_id" VARCHAR(64),
    "user_id" TEXT,
    "payload" JSONB,
    "dedupe_key" TEXT,
    "processed_at" TIMESTAMP(3),
    "processing_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_autonomy_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "platform_autonomy_events_dedupe_key_key" ON "platform_autonomy_events"("dedupe_key");

CREATE INDEX "platform_autonomy_events_event_type_created_at_idx" ON "platform_autonomy_events"("event_type", "created_at");

CREATE INDEX "platform_autonomy_events_processed_at_idx" ON "platform_autonomy_events"("processed_at");

CREATE TABLE "platform_automation_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "event_type" "PlatformAutonomyEventType" NOT NULL,
    "condition_json" JSONB,
    "action_kind" VARCHAR(64) NOT NULL,
    "action_payload" JSONB,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_automation_rules_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "platform_automation_rules_name_key" ON "platform_automation_rules"("name");

CREATE INDEX "platform_automation_rules_event_type_enabled_idx" ON "platform_automation_rules"("event_type", "enabled");
