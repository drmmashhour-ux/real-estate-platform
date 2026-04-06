-- Legal AI assistant: filterable audit for content license, readiness, contract explain, risk checks.
ALTER TABLE "ai_interaction_logs" ADD COLUMN "legal_context" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX "ai_interaction_logs_legal_context_created_at_idx" ON "ai_interaction_logs"("legal_context", "created_at");
