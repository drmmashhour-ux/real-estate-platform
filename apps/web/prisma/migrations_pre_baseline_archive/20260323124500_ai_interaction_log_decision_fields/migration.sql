-- Decision engine audit fields on ai_interaction_logs
ALTER TABLE "ai_interaction_logs" ADD COLUMN IF NOT EXISTS "decision_type" TEXT;
ALTER TABLE "ai_interaction_logs" ADD COLUMN IF NOT EXISTS "risk_level" TEXT;
