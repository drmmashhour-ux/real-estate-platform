-- LECIPM daily execution (live coaching checklist; per user, per calendar day).

CREATE TABLE "daily_tasks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "task_date" DATE NOT NULL,
    "task_type" TEXT NOT NULL,
    "target_count" INTEGER NOT NULL,
    "completed_count" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "metadata" JSONB,
    "replies_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_tasks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uq_daily_tasks_user_date_type" ON "daily_tasks"("user_id", "task_date", "task_type");
CREATE INDEX "idx_daily_tasks_user_date" ON "daily_tasks"("user_id", "task_date");

ALTER TABLE "daily_tasks" ADD CONSTRAINT "daily_tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
