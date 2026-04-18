-- First-users engine audit log (additive)
CREATE TABLE IF NOT EXISTS "launch_actions_log" (
    "id" TEXT NOT NULL,
    "run_date" DATE NOT NULL,
    "city" VARCHAR(128) NOT NULL,
    "source" VARCHAR(32) NOT NULL,
    "channel" VARCHAR(32) NOT NULL,
    "payload_json" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "launch_actions_log_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "launch_actions_log_run_date_city_idx" ON "launch_actions_log"("run_date", "city");
CREATE INDEX IF NOT EXISTS "launch_actions_log_created_at_idx" ON "launch_actions_log"("created_at");
