-- LECIPM revenue analytics + growth email log (deterministic MRR from Stripe sync).

ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "mrr_cents" INTEGER;

CREATE TABLE IF NOT EXISTS "revenue_snapshots" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "snapshot_date" DATE NOT NULL,
    "mrr" DECIMAL(18,2),
    "churn_rate" DECIMAL(12,8),
    "ltv" DECIMAL(18,2),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "revenue_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "revenue_snapshots_snapshot_date_key" ON "revenue_snapshots"("snapshot_date");
CREATE INDEX IF NOT EXISTS "idx_revenue_snapshots_date" ON "revenue_snapshots"("snapshot_date");

CREATE TABLE IF NOT EXISTS "growth_email_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL,
    "trigger_key" TEXT NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "subject" TEXT,
    "body_preview" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "growth_email_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "growth_email_logs_idempotency_key_key" ON "growth_email_logs"("idempotency_key");
CREATE INDEX IF NOT EXISTS "idx_growth_email_logs_user_id" ON "growth_email_logs"("user_id");
CREATE INDEX IF NOT EXISTS "idx_growth_email_logs_trigger_key" ON "growth_email_logs"("trigger_key");

ALTER TABLE "growth_email_logs" ADD CONSTRAINT "growth_email_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
