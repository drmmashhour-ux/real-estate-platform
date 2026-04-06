-- CRM follow-up reminders for broker dashboard
ALTER TABLE "Lead" ADD COLUMN "next_follow_up_at" TIMESTAMP(3);
ALTER TABLE "Lead" ADD COLUMN "reminder_status" TEXT;

CREATE INDEX "Lead_next_follow_up_at_idx" ON "Lead"("next_follow_up_at");
