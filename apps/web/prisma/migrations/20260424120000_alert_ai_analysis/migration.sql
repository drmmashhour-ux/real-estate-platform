CREATE TABLE IF NOT EXISTS "alert_ai_analyses" (
    "id" TEXT NOT NULL,
    "alert_id" TEXT NOT NULL,
    "summary" TEXT,
    "why_it_matters" TEXT,
    "suggested_actions" JSONB,
    "confidence" DOUBLE PRECISION,
    "risk_flags" JSONB,
    "assumptions" JSONB,
    "generated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "alert_ai_analyses_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "alert_ai_analyses_alert_id_key" ON "alert_ai_analyses"("alert_id");

ALTER TABLE "alert_ai_analyses" ADD CONSTRAINT "alert_ai_analyses_alert_id_fkey" FOREIGN KEY ("alert_id") REFERENCES "watchlist_alerts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
