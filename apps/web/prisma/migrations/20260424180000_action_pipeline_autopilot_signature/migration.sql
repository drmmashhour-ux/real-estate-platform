-- AI autopilot action pipeline + mandatory broker signature gate.
CREATE TYPE "ActionPipelineType" AS ENUM ('DEAL', 'DOCUMENT', 'INVESTMENT', 'CLOSING', 'FINANCE');
CREATE TYPE "ActionPipelineStatus" AS ENUM ('DRAFT', 'READY_FOR_SIGNATURE', 'SIGNED', 'EXECUTED');

CREATE TABLE IF NOT EXISTS "action_pipelines" (
    "id" TEXT NOT NULL,
    "type" "ActionPipelineType" NOT NULL,
    "data_json" JSONB NOT NULL,
    "ai_generated" BOOLEAN NOT NULL DEFAULT true,
    "status" "ActionPipelineStatus" NOT NULL,
    "deal_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "action_pipelines_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "action_pipelines_status_created_at_idx" ON "action_pipelines"("status", "created_at");
CREATE INDEX IF NOT EXISTS "action_pipelines_deal_id_idx" ON "action_pipelines"("deal_id");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'action_pipelines_deal_id_fkey') THEN
    ALTER TABLE "action_pipelines"
      ADD CONSTRAINT "action_pipelines_deal_id_fkey"
      FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "broker_signatures" (
    "id" TEXT NOT NULL,
    "broker_id" TEXT NOT NULL,
    "action_id" TEXT NOT NULL,
    "ip_address" VARCHAR(64),
    "user_agent" VARCHAR(512),
    "signed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "document_hash" VARCHAR(128) NOT NULL,
    CONSTRAINT "broker_signatures_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "broker_signatures_action_id_key" ON "broker_signatures"("action_id");
CREATE INDEX IF NOT EXISTS "broker_signatures_broker_id_idx" ON "broker_signatures"("broker_id");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'broker_signatures_broker_id_fkey') THEN
    ALTER TABLE "broker_signatures"
      ADD CONSTRAINT "broker_signatures_broker_id_fkey"
      FOREIGN KEY ("broker_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'broker_signatures_action_id_fkey') THEN
    ALTER TABLE "broker_signatures"
      ADD CONSTRAINT "broker_signatures_action_id_fkey"
      FOREIGN KEY ("action_id") REFERENCES "action_pipelines"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "signature_control_audit_logs" (
    "id" TEXT NOT NULL,
    "action_pipeline_id" TEXT NOT NULL,
    "deal_id" TEXT,
    "event_key" VARCHAR(64) NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "actor_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "signature_control_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "signature_control_audit_logs_action_pipeline_id_created_at_idx" ON "signature_control_audit_logs"("action_pipeline_id", "created_at");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'signature_control_audit_logs_action_pipeline_id_fkey') THEN
    ALTER TABLE "signature_control_audit_logs"
      ADD CONSTRAINT "signature_control_audit_logs_action_pipeline_id_fkey"
      FOREIGN KEY ("action_pipeline_id") REFERENCES "action_pipelines"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
