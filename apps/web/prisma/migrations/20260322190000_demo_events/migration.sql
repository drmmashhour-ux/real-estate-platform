-- Staging demo analytics (see lib/demo-analytics.ts)
CREATE TABLE "demo_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "event" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "demo_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "demo_events_event_created_at_idx" ON "demo_events"("event", "created_at");
CREATE INDEX "demo_events_created_at_idx" ON "demo_events"("created_at");

ALTER TABLE "demo_events" ADD CONSTRAINT "demo_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
