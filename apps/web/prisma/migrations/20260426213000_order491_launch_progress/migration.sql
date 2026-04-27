-- Order 49.1: per-user 7-day launch plan execution state
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "launch_plan_start_at" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "launch_progress" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "day" INTEGER NOT NULL,
    "task_index" INTEGER NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "launch_progress_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "launch_progress_user_id_day_task_index_key" ON "launch_progress"("user_id", "day", "task_index");
CREATE INDEX IF NOT EXISTS "launch_progress_user_id_day_idx" ON "launch_progress"("user_id", "day");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'launch_progress_user_id_fkey'
  ) THEN
    ALTER TABLE "launch_progress" ADD CONSTRAINT "launch_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END$$;
