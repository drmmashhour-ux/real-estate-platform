-- AlterTable
ALTER TABLE "Lead" ADD COLUMN "engagement_score" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "score_level" TEXT,
ADD COLUMN "evaluation_email_status" TEXT NOT NULL DEFAULT 'none',
ADD COLUMN "last_automation_email_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Lead_engagement_score_idx" ON "Lead"("engagement_score");

-- CreateTable
CREATE TABLE "lead_automation_tasks" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "task_key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "due_at" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "lead_automation_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lead_automation_tasks_lead_id_status_idx" ON "lead_automation_tasks"("lead_id", "status");

-- CreateIndex
CREATE INDEX "lead_automation_tasks_due_at_status_idx" ON "lead_automation_tasks"("due_at", "status");

-- AddForeignKey
ALTER TABLE "lead_automation_tasks" ADD CONSTRAINT "lead_automation_tasks_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
