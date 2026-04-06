-- Launch validation: persona gate + event stream
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "launch_onboarding_completed_at" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "launch_persona_choice" VARCHAR(32);

CREATE TABLE IF NOT EXISTS "launch_events" (
    "id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "launch_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "launch_events_event_created_at_idx" ON "launch_events"("event", "created_at");
CREATE INDEX IF NOT EXISTS "launch_events_created_at_idx" ON "launch_events"("created_at");
