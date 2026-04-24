-- Broker decision-support deal scores (versioned snapshots; advisory only).
CREATE TABLE IF NOT EXISTS "deal_scores" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "category" VARCHAR(16) NOT NULL,
    "risk_level" VARCHAR(8) NOT NULL,
    "reasoning_json" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "deal_scores_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "deal_scores_deal_id_created_at_idx" ON "deal_scores"("deal_id", "created_at" DESC);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'deal_scores_deal_id_fkey'
  ) THEN
    ALTER TABLE "deal_scores"
      ADD CONSTRAINT "deal_scores_deal_id_fkey"
      FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
