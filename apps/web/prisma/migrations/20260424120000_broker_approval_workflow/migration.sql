-- OACIQ-attested broker approvals with optional signature session linkage.
CREATE TABLE IF NOT EXISTS "broker_approvals" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "status" VARCHAR(16) NOT NULL DEFAULT 'PENDING',
    "action_key" VARCHAR(96) NOT NULL DEFAULT 'execution_prep',
    "action_payload" JSONB NOT NULL DEFAULT '{}',
    "before_snapshot" JSONB NOT NULL DEFAULT '{}',
    "after_snapshot" JSONB,
    "requested_by_user_id" VARCHAR(36),
    "decided_by_user_id" VARCHAR(36),
    "decided_at" TIMESTAMP(3),
    "oaciq_acknowledged_at" TIMESTAMP(3),
    "oaciq_ack_text_version" VARCHAR(48) NOT NULL DEFAULT 'v1_oaciq_broker_2026',
    "rejection_reason" TEXT,
    "signature_session_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "broker_approvals_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "broker_approvals_signature_session_id_key" ON "broker_approvals"("signature_session_id");

CREATE INDEX IF NOT EXISTS "broker_approvals_deal_id_status_idx" ON "broker_approvals"("deal_id", "status");

CREATE INDEX IF NOT EXISTS "broker_approvals_deal_id_created_at_idx" ON "broker_approvals"("deal_id", "created_at" DESC);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'broker_approvals_deal_id_fkey'
  ) THEN
    ALTER TABLE "broker_approvals"
      ADD CONSTRAINT "broker_approvals_deal_id_fkey"
      FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'broker_approvals_signature_session_id_fkey'
  ) THEN
    ALTER TABLE "broker_approvals"
      ADD CONSTRAINT "broker_approvals_signature_session_id_fkey"
      FOREIGN KEY ("signature_session_id") REFERENCES "signature_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
