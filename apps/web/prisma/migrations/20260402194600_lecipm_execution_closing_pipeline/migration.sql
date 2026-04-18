-- LECIPM execution + signature + closing conditions (platform coordination — not OACIQ replacement)
CREATE TYPE "LecipmExecutionPipelineState" AS ENUM (
  'draft',
  'broker_review_required',
  'broker_approved',
  'ready_for_execution',
  'execution_in_progress',
  'awaiting_signature',
  'partially_signed',
  'fully_signed',
  'conditions_pending',
  'closing_ready',
  'closed',
  'archived'
);

ALTER TABLE "deals" ADD COLUMN "lecipm_execution_pipeline_state" "LecipmExecutionPipelineState";

CREATE INDEX "deals_lecipm_execution_pipeline_state_idx" ON "deals"("lecipm_execution_pipeline_state");

CREATE TABLE "deal_execution_approvals" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "approved_by_id" TEXT NOT NULL,
    "approved_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "snapshot" JSONB NOT NULL DEFAULT '{}',
    "notes" TEXT,

    CONSTRAINT "deal_execution_approvals_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "deal_execution_approvals_deal_id_idx" ON "deal_execution_approvals"("deal_id");
CREATE INDEX "deal_execution_approvals_approved_at_idx" ON "deal_execution_approvals"("approved_at");

ALTER TABLE "deal_execution_approvals" ADD CONSTRAINT "deal_execution_approvals_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "deal_execution_approvals" ADD CONSTRAINT "deal_execution_approvals_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "signature_sessions" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "status" VARCHAR(32) NOT NULL,
    "provider" VARCHAR(32) NOT NULL,
    "provider_session_id" VARCHAR(160),
    "document_ids" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "signature_sessions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "signature_sessions_deal_id_idx" ON "signature_sessions"("deal_id");
CREATE INDEX "signature_sessions_provider_status_idx" ON "signature_sessions"("provider", "status");

ALTER TABLE "signature_sessions" ADD CONSTRAINT "signature_sessions_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "signature_participants" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" VARCHAR(32) NOT NULL,
    "email" TEXT,
    "status" VARCHAR(24) NOT NULL DEFAULT 'pending',
    "signed_at" TIMESTAMP(3),

    CONSTRAINT "signature_participants_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "signature_participants_session_id_idx" ON "signature_participants"("session_id");

ALTER TABLE "signature_participants" ADD CONSTRAINT "signature_participants_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "signature_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "deal_closing_conditions" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "condition_type" VARCHAR(64) NOT NULL,
    "deadline" TIMESTAMP(3),
    "status" VARCHAR(24) NOT NULL DEFAULT 'pending',
    "related_form" VARCHAR(32),
    "notes" TEXT,
    "fulfilled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deal_closing_conditions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "deal_closing_conditions_deal_id_idx" ON "deal_closing_conditions"("deal_id");
CREATE INDEX "deal_closing_conditions_deadline_idx" ON "deal_closing_conditions"("deadline");

ALTER TABLE "deal_closing_conditions" ADD CONSTRAINT "deal_closing_conditions_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
