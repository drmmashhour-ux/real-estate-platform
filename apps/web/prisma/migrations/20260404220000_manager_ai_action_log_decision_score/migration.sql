-- Manager AI action log: Host Autopilot decision engine fields

ALTER TABLE "manager_ai_action_logs" ADD COLUMN "decision_score" DOUBLE PRECISION;
ALTER TABLE "manager_ai_action_logs" ADD COLUMN "suppression_reason" TEXT;
