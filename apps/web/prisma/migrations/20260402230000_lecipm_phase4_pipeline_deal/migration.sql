-- Phase 4 — Broker pipeline deals (LEC-DEAL-*), committee, conditions, diligence, audit.

CREATE TABLE "lecipm_deal_number_sequences" (
    "year" INTEGER NOT NULL,
    "last_seq" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "lecipm_deal_number_sequences_pkey" PRIMARY KEY ("year")
);

CREATE TABLE "lecipm_pipeline_deals" (
    "id" TEXT NOT NULL,
    "transaction_id" VARCHAR(36),
    "listing_id" VARCHAR(36),
    "broker_id" VARCHAR(36) NOT NULL,
    "deal_number" VARCHAR(48) NOT NULL,
    "title" VARCHAR(512) NOT NULL,
    "deal_type" VARCHAR(32) NOT NULL,
    "pipeline_stage" VARCHAR(40) NOT NULL DEFAULT 'SCREENING',
    "decision_status" VARCHAR(40) NOT NULL DEFAULT 'PENDING',
    "priority" VARCHAR(16),
    "owner_user_id" VARCHAR(36),
    "sponsor_user_id" VARCHAR(36),
    "latest_transaction_number" VARCHAR(48),
    "latest_memo_ref" VARCHAR(512),
    "latest_summary" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lecipm_pipeline_deals_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "lecipm_pipeline_deals_transaction_id_key" ON "lecipm_pipeline_deals"("transaction_id");
CREATE UNIQUE INDEX "lecipm_pipeline_deals_deal_number_key" ON "lecipm_pipeline_deals"("deal_number");
CREATE INDEX "lecipm_pipeline_deals_broker_id_pipeline_stage_idx" ON "lecipm_pipeline_deals"("broker_id", "pipeline_stage");
CREATE INDEX "lecipm_pipeline_deals_broker_id_updated_at_idx" ON "lecipm_pipeline_deals"("broker_id", "updated_at");
CREATE INDEX "lecipm_pipeline_deals_listing_id_idx" ON "lecipm_pipeline_deals"("listing_id");

ALTER TABLE "lecipm_pipeline_deals" ADD CONSTRAINT "lecipm_pipeline_deals_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "lecipm_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "lecipm_pipeline_deals" ADD CONSTRAINT "lecipm_pipeline_deals_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "lecipm_pipeline_deals" ADD CONSTRAINT "lecipm_pipeline_deals_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "lecipm_pipeline_deals" ADD CONSTRAINT "lecipm_pipeline_deals_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "lecipm_pipeline_deals" ADD CONSTRAINT "lecipm_pipeline_deals_sponsor_user_id_fkey" FOREIGN KEY ("sponsor_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "lecipm_pipeline_deal_stage_histories" (
    "id" TEXT NOT NULL,
    "deal_id" VARCHAR(36) NOT NULL,
    "from_stage" VARCHAR(40),
    "to_stage" VARCHAR(40) NOT NULL,
    "changed_by_user_id" VARCHAR(36),
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "lecipm_pipeline_deal_stage_histories_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "lecipm_pipeline_deal_stage_histories_deal_id_created_at_idx" ON "lecipm_pipeline_deal_stage_histories"("deal_id", "created_at");
ALTER TABLE "lecipm_pipeline_deal_stage_histories" ADD CONSTRAINT "lecipm_pipeline_deal_stage_histories_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "lecipm_pipeline_deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "lecipm_pipeline_deal_committee_submissions" (
    "id" TEXT NOT NULL,
    "deal_id" VARCHAR(36) NOT NULL,
    "submitted_by_user_id" VARCHAR(36),
    "status" VARCHAR(24) NOT NULL DEFAULT 'SUBMITTED',
    "summary" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decided_at" TIMESTAMP(3),
    CONSTRAINT "lecipm_pipeline_deal_committee_submissions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "lecipm_pipeline_deal_committee_submissions_deal_id_status_idx" ON "lecipm_pipeline_deal_committee_submissions"("deal_id", "status");
ALTER TABLE "lecipm_pipeline_deal_committee_submissions" ADD CONSTRAINT "lecipm_pipeline_deal_committee_submissions_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "lecipm_pipeline_deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "lecipm_pipeline_deal_committee_decisions" (
    "id" TEXT NOT NULL,
    "deal_id" VARCHAR(36) NOT NULL,
    "submission_id" VARCHAR(36),
    "decided_by_user_id" VARCHAR(36),
    "recommendation" VARCHAR(40) NOT NULL,
    "rationale" TEXT NOT NULL,
    "confidence_level" VARCHAR(16),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "lecipm_pipeline_deal_committee_decisions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "lecipm_pipeline_deal_committee_decisions_deal_id_idx" ON "lecipm_pipeline_deal_committee_decisions"("deal_id");
ALTER TABLE "lecipm_pipeline_deal_committee_decisions" ADD CONSTRAINT "lecipm_pipeline_deal_committee_decisions_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "lecipm_pipeline_deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lecipm_pipeline_deal_committee_decisions" ADD CONSTRAINT "lecipm_pipeline_deal_committee_decisions_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "lecipm_pipeline_deal_committee_submissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "lecipm_pipeline_deal_conditions" (
    "id" TEXT NOT NULL,
    "deal_id" VARCHAR(36) NOT NULL,
    "title" VARCHAR(512) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(24) NOT NULL,
    "priority" VARCHAR(16) NOT NULL,
    "status" VARCHAR(16) NOT NULL DEFAULT 'OPEN',
    "owner_user_id" VARCHAR(36),
    "due_date" TIMESTAMP(3),
    "notes" TEXT,
    "satisfied_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "lecipm_pipeline_deal_conditions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "lecipm_pipeline_deal_conditions_deal_id_status_idx" ON "lecipm_pipeline_deal_conditions"("deal_id", "status");
ALTER TABLE "lecipm_pipeline_deal_conditions" ADD CONSTRAINT "lecipm_pipeline_deal_conditions_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "lecipm_pipeline_deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "lecipm_pipeline_deal_diligence_tasks" (
    "id" TEXT NOT NULL,
    "deal_id" VARCHAR(36) NOT NULL,
    "linked_condition_id" VARCHAR(36),
    "title" VARCHAR(512) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(24) NOT NULL,
    "priority" VARCHAR(16),
    "status" VARCHAR(16) NOT NULL DEFAULT 'OPEN',
    "owner_user_id" VARCHAR(36),
    "due_date" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "lecipm_pipeline_deal_diligence_tasks_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "lecipm_pipeline_deal_diligence_tasks_deal_id_status_idx" ON "lecipm_pipeline_deal_diligence_tasks"("deal_id", "status");
ALTER TABLE "lecipm_pipeline_deal_diligence_tasks" ADD CONSTRAINT "lecipm_pipeline_deal_diligence_tasks_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "lecipm_pipeline_deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lecipm_pipeline_deal_diligence_tasks" ADD CONSTRAINT "lecipm_pipeline_deal_diligence_tasks_linked_condition_id_fkey" FOREIGN KEY ("linked_condition_id") REFERENCES "lecipm_pipeline_deal_conditions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "lecipm_pipeline_deal_audit_events" (
    "id" TEXT NOT NULL,
    "deal_id" VARCHAR(36) NOT NULL,
    "event_type" VARCHAR(64) NOT NULL,
    "actor_user_id" VARCHAR(36),
    "summary" TEXT NOT NULL,
    "metadata_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "lecipm_pipeline_deal_audit_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "lecipm_pipeline_deal_audit_events_deal_id_created_at_idx" ON "lecipm_pipeline_deal_audit_events"("deal_id", "created_at");
ALTER TABLE "lecipm_pipeline_deal_audit_events" ADD CONSTRAINT "lecipm_pipeline_deal_audit_events_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "lecipm_pipeline_deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
