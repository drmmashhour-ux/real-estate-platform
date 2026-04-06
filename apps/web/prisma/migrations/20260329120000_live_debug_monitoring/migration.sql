-- Extend product funnel enum + live monitoring indexes + error_events table
ALTER TYPE "UserEventType" ADD VALUE IF NOT EXISTS 'SEARCH_PERFORMED';
ALTER TYPE "UserEventType" ADD VALUE IF NOT EXISTS 'MESSAGE_SENT';
ALTER TYPE "UserEventType" ADD VALUE IF NOT EXISTS 'AI_REPLY_SENT';

CREATE INDEX IF NOT EXISTS "user_events_user_id_eventType_created_at_idx" ON "user_events"("user_id", "eventType", "created_at");

CREATE TABLE IF NOT EXISTS "error_events" (
    "id" TEXT NOT NULL,
    "error_type" VARCHAR(64) NOT NULL,
    "message" TEXT NOT NULL,
    "stack" TEXT,
    "user_id" TEXT,
    "route" VARCHAR(512),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "error_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "error_events_error_type_created_at_idx" ON "error_events"("error_type", "created_at");
CREATE INDEX IF NOT EXISTS "error_events_user_id_created_at_idx" ON "error_events"("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "error_events_created_at_idx" ON "error_events"("created_at");

DO $$
BEGIN
  ALTER TABLE "error_events" ADD CONSTRAINT "error_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
