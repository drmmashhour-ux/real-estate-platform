-- Growth metrics: optional user_id on launch_events for admin aggregation (no fake metrics).
ALTER TABLE "launch_events" ADD COLUMN IF NOT EXISTS "user_id" TEXT;

CREATE INDEX IF NOT EXISTS "launch_events_user_id_created_at_idx" ON "launch_events"("user_id", "created_at");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'launch_events_user_id_fkey'
  ) THEN
    ALTER TABLE "launch_events"
      ADD CONSTRAINT "launch_events_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
