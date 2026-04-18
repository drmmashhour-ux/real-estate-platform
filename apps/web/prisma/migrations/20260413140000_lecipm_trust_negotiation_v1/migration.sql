-- LECIPM deal-file payments, trust workflow, ledger, negotiation copilot (v1). Broker-controlled; not a regulated trust unless configured.

CREATE TYPE "LecipmPaymentKind" AS ENUM (
  'deposit',
  'additional_sum',
  'balance_due',
  'trust_release',
  'refund',
  'fee'
);

CREATE TYPE "LecipmPaymentRecordStatus" AS ENUM (
  'draft',
  'requested',
  'awaiting_payment',
  'awaiting_confirmation',
  'confirmed',
  'held',
  'release_pending',
  'released',
  'refund_pending',
  'refunded',
  'failed',
  'cancelled'
);

CREATE TYPE "LecipmTrustWorkflowMode" AS ENUM (
  'tracking_only',
  'manual_trust_workflow',
  'provider_connected',
  'notary_coordinated'
);

CREATE TYPE "LecipmTrustWorkflowStatus" AS ENUM (
  'not_started',
  'profiled',
  'funds_expected',
  'funds_held',
  'release_scheduled',
  'released',
  'closed'
);

CREATE TYPE "LecipmLedgerEntryKind" AS ENUM (
  'request_created',
  'payment_received',
  'payment_confirmed',
  'held_in_trust',
  'released_to_notary_or_closing',
  'refunded',
  'adjustment',
  'failure'
);

CREATE TYPE "LecipmPaymentConfirmationKind" AS ENUM (
  'manual_broker',
  'provider_webhook',
  'bank_reference_upload',
  'notary_attestation',
  'other'
);

CREATE TYPE "NegotiationThreadStatus" AS ENUM (
  'active',
  'paused',
  'closed',
  'archived'
);

CREATE TYPE "NegotiationRoundStatus" AS ENUM (
  'draft',
  'open',
  'responded',
  'closed'
);

CREATE TYPE "NegotiationProposalType" AS ENUM (
  'initial_offer',
  'counter_offer',
  'occupancy_adjustment',
  'deed_date_adjustment',
  'deposit_adjustment',
  'financing_adjustment',
  'inspection_adjustment',
  'concession_bundle',
  'other'
);

CREATE TYPE "NegotiationProposalSource" AS ENUM (
  'copilot',
  'broker_manual',
  'imported'
);

CREATE TYPE "NegotiationProposalRecordStatus" AS ENUM (
  'draft',
  'pending_review',
  'approved',
  'rejected',
  'superseded'
);

CREATE TYPE "NegotiationSuggestionStatus" AS ENUM (
  'draft',
  'pending_review',
  'approved',
  'rejected',
  'applied'
);

CREATE TABLE "lecipm_deal_payments" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "payment_kind" "LecipmPaymentKind" NOT NULL,
    "status" "LecipmPaymentRecordStatus" NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "currency" VARCHAR(8) NOT NULL DEFAULT 'cad',
    "requested_at" TIMESTAMP(3),
    "due_at" TIMESTAMP(3),
    "received_at" TIMESTAMP(3),
    "confirmed_at" TIMESTAMP(3),
    "released_at" TIMESTAMP(3),
    "refunded_at" TIMESTAMP(3),
    "provider" VARCHAR(64) NOT NULL,
    "provider_reference" VARCHAR(160),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lecipm_deal_payments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lecipm_deal_payments_deal_id_idx" ON "lecipm_deal_payments"("deal_id");
CREATE INDEX "lecipm_deal_payments_status_idx" ON "lecipm_deal_payments"("status");
CREATE INDEX "lecipm_deal_payments_payment_kind_idx" ON "lecipm_deal_payments"("payment_kind");

ALTER TABLE "lecipm_deal_payments" ADD CONSTRAINT "lecipm_deal_payments_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "lecipm_payment_instructions" (
    "id" TEXT NOT NULL,
    "deal_payment_id" TEXT NOT NULL,
    "instruction_type" VARCHAR(64) NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lecipm_payment_instructions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lecipm_payment_instructions_deal_payment_id_idx" ON "lecipm_payment_instructions"("deal_payment_id");

ALTER TABLE "lecipm_payment_instructions" ADD CONSTRAINT "lecipm_payment_instructions_deal_payment_id_fkey" FOREIGN KEY ("deal_payment_id") REFERENCES "lecipm_deal_payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "lecipm_trust_workflows" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "mode" "LecipmTrustWorkflowMode" NOT NULL,
    "status" "LecipmTrustWorkflowStatus" NOT NULL DEFAULT 'not_started',
    "trustee_name" VARCHAR(160),
    "trustee_type" VARCHAR(64),
    "trust_account_reference" VARCHAR(160),
    "notes" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lecipm_trust_workflows_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "lecipm_trust_workflows_deal_id_key" ON "lecipm_trust_workflows"("deal_id");
CREATE INDEX "lecipm_trust_workflows_deal_id_idx" ON "lecipm_trust_workflows"("deal_id");

ALTER TABLE "lecipm_trust_workflows" ADD CONSTRAINT "lecipm_trust_workflows_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "lecipm_payment_ledger_entries" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "payment_id" TEXT,
    "entry_kind" "LecipmLedgerEntryKind" NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "currency" VARCHAR(8) NOT NULL DEFAULT 'cad',
    "description" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lecipm_payment_ledger_entries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lecipm_payment_ledger_entries_deal_id_idx" ON "lecipm_payment_ledger_entries"("deal_id");
CREATE INDEX "lecipm_payment_ledger_entries_payment_id_idx" ON "lecipm_payment_ledger_entries"("payment_id");
CREATE INDEX "lecipm_payment_ledger_entries_entry_kind_idx" ON "lecipm_payment_ledger_entries"("entry_kind");

ALTER TABLE "lecipm_payment_ledger_entries" ADD CONSTRAINT "lecipm_payment_ledger_entries_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lecipm_payment_ledger_entries" ADD CONSTRAINT "lecipm_payment_ledger_entries_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "lecipm_deal_payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "lecipm_payment_confirmations" (
    "id" TEXT NOT NULL,
    "deal_payment_id" TEXT NOT NULL,
    "confirmation_type" "LecipmPaymentConfirmationKind" NOT NULL,
    "confirmed_by_id" TEXT NOT NULL,
    "evidence" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lecipm_payment_confirmations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lecipm_payment_confirmations_deal_payment_id_idx" ON "lecipm_payment_confirmations"("deal_payment_id");

ALTER TABLE "lecipm_payment_confirmations" ADD CONSTRAINT "lecipm_payment_confirmations_deal_payment_id_fkey" FOREIGN KEY ("deal_payment_id") REFERENCES "lecipm_deal_payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lecipm_payment_confirmations" ADD CONSTRAINT "lecipm_payment_confirmations_confirmed_by_id_fkey" FOREIGN KEY ("confirmed_by_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "negotiation_threads" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "status" "NegotiationThreadStatus" NOT NULL DEFAULT 'active',
    "current_round" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "negotiation_threads_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "negotiation_threads_deal_id_idx" ON "negotiation_threads"("deal_id");

ALTER TABLE "negotiation_threads" ADD CONSTRAINT "negotiation_threads_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "negotiation_rounds" (
    "id" TEXT NOT NULL,
    "thread_id" TEXT NOT NULL,
    "round_number" INTEGER NOT NULL,
    "initiating_party" VARCHAR(32) NOT NULL,
    "status" "NegotiationRoundStatus" NOT NULL DEFAULT 'draft',
    "reference_document_id" VARCHAR(160),
    "summary" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "negotiation_rounds_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "negotiation_rounds_thread_id_round_number_key" ON "negotiation_rounds"("thread_id", "round_number");
CREATE INDEX "negotiation_rounds_thread_id_idx" ON "negotiation_rounds"("thread_id");

ALTER TABLE "negotiation_rounds" ADD CONSTRAINT "negotiation_rounds_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "negotiation_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "negotiation_proposals" (
    "id" TEXT NOT NULL,
    "round_id" TEXT NOT NULL,
    "proposal_type" "NegotiationProposalType" NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "source" "NegotiationProposalSource" NOT NULL,
    "status" "NegotiationProposalRecordStatus" NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "negotiation_proposals_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "negotiation_proposals_round_id_idx" ON "negotiation_proposals"("round_id");

ALTER TABLE "negotiation_proposals" ADD CONSTRAINT "negotiation_proposals_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "negotiation_rounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "negotiation_suggestions" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "suggestion_type" VARCHAR(64) NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "confidence" DOUBLE PRECISION,
    "impact_estimate" VARCHAR(32),
    "risk_level" VARCHAR(24),
    "source_references" JSONB NOT NULL DEFAULT '[]',
    "status" "NegotiationSuggestionStatus" NOT NULL DEFAULT 'pending_review',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "negotiation_suggestions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "negotiation_suggestions_deal_id_idx" ON "negotiation_suggestions"("deal_id");
CREATE INDEX "negotiation_suggestions_status_idx" ON "negotiation_suggestions"("status");

ALTER TABLE "negotiation_suggestions" ADD CONSTRAINT "negotiation_suggestions_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
