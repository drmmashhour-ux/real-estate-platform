-- Add evidence score column for landing insights (Ads Automation V4 UI + persistence).

ALTER TABLE "ads_automation_landing_insights" ADD COLUMN IF NOT EXISTS "evidence_score" DOUBLE PRECISION;
