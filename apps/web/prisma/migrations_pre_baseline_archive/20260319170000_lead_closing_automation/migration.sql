-- Closing automation: stage timestamps, LeadTask, optional backfill of legacy pipeline values

ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "first_contact_at" TIMESTAMP(3);
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "last_contact_at" TIMESTAMP(3);
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "qualified_at" TIMESTAMP(3);
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "meeting_scheduled_at" TIMESTAMP(3);
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "closing_at" TIMESTAMP(3);
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "won_at" TIMESTAMP(3);
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "lost_at" TIMESTAMP(3);
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "lost_reason" TEXT;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "post_meeting_outcome" TEXT;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "deal_outcome_notes" TEXT;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "final_deal_value" INTEGER;

-- Align timestamps from existing touch fields where possible
UPDATE "Lead"
SET
  "last_contact_at" = COALESCE("last_contact_at", "last_contacted_at"),
  "first_contact_at" = COALESCE("first_contact_at", "last_contacted_at")
WHERE "last_contacted_at" IS NOT NULL;

UPDATE "Lead"
SET "meeting_scheduled_at" = COALESCE("meeting_scheduled_at", "meeting_at")
WHERE "meeting_at" IS NOT NULL;

UPDATE "Lead"
SET "won_at" = COALESCE("won_at", "deal_closed_at")
WHERE "deal_closed_at" IS NOT NULL AND "pipeline_status" = 'won';

-- Canonical pipeline labels (idempotent)
UPDATE "Lead" SET "pipeline_status" = 'meeting_scheduled', "pipeline_stage" = 'meeting_scheduled' WHERE "pipeline_status" = 'meeting';
UPDATE "Lead" SET "pipeline_status" = 'closing', "pipeline_stage" = 'closing' WHERE "pipeline_status" = 'in_progress';
UPDATE "Lead" SET "pipeline_status" = 'won', "pipeline_stage" = 'won' WHERE "pipeline_status" = 'closed';

CREATE TABLE IF NOT EXISTS "lead_tasks" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "task_key" TEXT,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "due_at" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_tasks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "lead_tasks_lead_id_status_idx" ON "lead_tasks"("lead_id", "status");
CREATE INDEX IF NOT EXISTS "lead_tasks_due_at_idx" ON "lead_tasks"("due_at");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'lead_tasks_lead_id_fkey'
  ) THEN
    ALTER TABLE "lead_tasks" ADD CONSTRAINT "lead_tasks_lead_id_fkey"
      FOREIGN KEY ("lead_id") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
