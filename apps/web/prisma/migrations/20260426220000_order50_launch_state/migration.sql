-- Order 50: global one-click launch mode (read/write only this table + analytics events)
CREATE TABLE IF NOT EXISTS "launch_state" (
    "id" TEXT NOT NULL,
    "started_at" TIMESTAMP(3),
    "status" VARCHAR(16) NOT NULL DEFAULT 'running',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "launch_state_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "launch_state_status_created_at_idx" ON "launch_state"("status", "created_at");
