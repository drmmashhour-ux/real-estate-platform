-- Safe additive: Autopilot leads layer (ai* columns only)

ALTER TABLE "Lead" ADD COLUMN "lead_ai_score" DOUBLE PRECISION;
ALTER TABLE "Lead" ADD COLUMN "lead_ai_priority" VARCHAR(16);
ALTER TABLE "Lead" ADD COLUMN "lead_ai_tags" JSONB;
ALTER TABLE "Lead" ADD COLUMN "lead_ai_last_updated" TIMESTAMP(3);
ALTER TABLE "Lead" ADD COLUMN "lead_ai_execution_version" VARCHAR(16);

CREATE INDEX "Lead_lead_ai_priority_idx" ON "Lead"("lead_ai_priority");
CREATE INDEX "Lead_lead_ai_score_idx" ON "Lead"("lead_ai_score");
