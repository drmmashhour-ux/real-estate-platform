-- Team workspace: operator roles + tasks + daily reports + targets

ALTER TYPE "PlatformRole" ADD VALUE IF NOT EXISTS 'CONTENT_OPERATOR';
ALTER TYPE "PlatformRole" ADD VALUE IF NOT EXISTS 'LISTING_OPERATOR';
ALTER TYPE "PlatformRole" ADD VALUE IF NOT EXISTS 'OUTREACH_OPERATOR';
ALTER TYPE "PlatformRole" ADD VALUE IF NOT EXISTS 'SUPPORT_AGENT';

CREATE TYPE "TeamTaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'DONE', 'CANCELLED');
CREATE TYPE "TeamTaskPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH');

CREATE TABLE "team_tasks" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(512) NOT NULL,
    "description" TEXT,
    "status" "TeamTaskStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "TeamTaskPriority" NOT NULL DEFAULT 'NORMAL',
    "assignee_user_id" TEXT NOT NULL,
    "created_by_user_id" TEXT NOT NULL,
    "due_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "impact_score" INTEGER,
    "result_notes" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_tasks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "team_tasks_assignee_user_id_status_idx" ON "team_tasks"("assignee_user_id", "status");
CREATE INDEX "team_tasks_status_created_at_idx" ON "team_tasks"("status", "created_at");

ALTER TABLE "team_tasks" ADD CONSTRAINT "team_tasks_assignee_user_id_fkey" FOREIGN KEY ("assignee_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "team_tasks" ADD CONSTRAINT "team_tasks_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "team_daily_reports" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "report_day" VARCHAR(10) NOT NULL,
    "completed_work" TEXT NOT NULL,
    "results" TEXT,
    "issues" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_daily_reports_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "team_daily_reports_user_id_report_day_key" ON "team_daily_reports"("user_id", "report_day");
CREATE INDEX "team_daily_reports_report_day_idx" ON "team_daily_reports"("report_day");

ALTER TABLE "team_daily_reports" ADD CONSTRAINT "team_daily_reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "team_daily_targets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "target_day" VARCHAR(10) NOT NULL,
    "task_goal" INTEGER NOT NULL DEFAULT 5,
    "notes" TEXT,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_daily_targets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "team_daily_targets_user_id_target_day_key" ON "team_daily_targets"("user_id", "target_day");

ALTER TABLE "team_daily_targets" ADD CONSTRAINT "team_daily_targets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "team_daily_targets" ADD CONSTRAINT "team_daily_targets_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
