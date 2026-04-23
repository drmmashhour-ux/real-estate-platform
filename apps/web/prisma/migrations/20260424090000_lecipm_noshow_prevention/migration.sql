-- LECIPM no-show prevention: workflow + risk + reminders metadata on lecipm_visits

CREATE TYPE "LecipmVisitWorkflowState" AS ENUM (
  'BOOKED', 'CONFIRMED', 'REMINDER_SENT', 'RESCHEDULE_REQUESTED', 'RESCHEDULED',
  'NO_SHOW_RISK_HIGH', 'MISSED', 'COMPLETED', 'CANCELED'
);

CREATE TYPE "LecipmNoShowRiskBand" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

ALTER TABLE "lecipm_visits" ADD COLUMN IF NOT EXISTS "workflow_state" "LecipmVisitWorkflowState" NOT NULL DEFAULT 'BOOKED';
ALTER TABLE "lecipm_visits" ADD COLUMN IF NOT EXISTS "reconfirmed_at" TIMESTAMP(3);
ALTER TABLE "lecipm_visits" ADD COLUMN IF NOT EXISTS "reconfirm_method" VARCHAR(32);
ALTER TABLE "lecipm_visits" ADD COLUMN IF NOT EXISTS "no_show_risk_score" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "lecipm_visits" ADD COLUMN IF NOT EXISTS "no_show_risk_band" "LecipmNoShowRiskBand";
ALTER TABLE "lecipm_visits" ADD COLUMN IF NOT EXISTS "last_reminder_at" TIMESTAMP(3);
ALTER TABLE "lecipm_visits" ADD COLUMN IF NOT EXISTS "last_reminder_kind" VARCHAR(16);
ALTER TABLE "lecipm_visits" ADD COLUMN IF NOT EXISTS "reminder_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "lecipm_visits" ADD COLUMN IF NOT EXISTS "engagement_hints" JSONB;
ALTER TABLE "lecipm_visits" ADD COLUMN IF NOT EXISTS "reschedule_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "lecipm_visits" ADD COLUMN IF NOT EXISTS "lead_decline_reason" TEXT;

CREATE INDEX IF NOT EXISTS "lecipm_visits_workflow_state_idx" ON "lecipm_visits"("workflow_state");
CREATE INDEX IF NOT EXISTS "lecipm_visits_no_show_risk_band_idx" ON "lecipm_visits"("no_show_risk_band");
