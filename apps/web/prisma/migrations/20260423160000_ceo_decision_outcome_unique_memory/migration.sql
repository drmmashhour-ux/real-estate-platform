-- One outcome row per decision memory (idempotent outcome writes).
CREATE UNIQUE INDEX IF NOT EXISTS "ceo_decision_outcomes_memory_id_key" ON "ceo_decision_outcomes"("memory_id");
