-- Investment pipeline + committee workflow (distinct from transactional `Deal`).

CREATE TABLE "investment_pipeline_deals" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "pipeline_stage" TEXT NOT NULL DEFAULT 'SOURCED',
    "priority" TEXT,
    "owner_user_id" TEXT,
    "sponsor_user_id" TEXT,
    "committee_required" BOOLEAN NOT NULL DEFAULT true,
    "headline_recommendation" TEXT,
    "confidence_level" TEXT,
    "decision_status" TEXT,
    "latest_memo_id" TEXT,
    "latest_ic_pack_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "closed_at" TIMESTAMP(3),

    CONSTRAINT "investment_pipeline_deals_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "investment_pipeline_deal_stage_histories" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "from_stage" TEXT,
    "to_stage" TEXT NOT NULL,
    "changed_by_user_id" TEXT,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "investment_pipeline_deal_stage_histories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "investment_pipeline_committee_submissions" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "submitted_by_user_id" TEXT,
    "memo_id" TEXT,
    "ic_pack_id" TEXT,
    "submission_status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "meeting_date" TIMESTAMP(3),
    "summary_text" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "investment_pipeline_committee_submissions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "investment_pipeline_committee_decisions" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "submission_id" TEXT,
    "decided_by_user_id" TEXT,
    "recommendation" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "confidence_level" TEXT,
    "decision_json" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "investment_pipeline_committee_decisions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "investment_pipeline_conditions" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "priority" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "owner_user_id" TEXT,
    "due_date" TIMESTAMP(3),
    "evidence_required_json" JSONB,
    "notes" TEXT,
    "waiver_note" TEXT,
    "waived_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "satisfied_at" TIMESTAMP(3),

    CONSTRAINT "investment_pipeline_conditions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "investment_pipeline_diligence_tasks" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "priority" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "owner_user_id" TEXT,
    "due_date" TIMESTAMP(3),
    "linked_condition_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "investment_pipeline_diligence_tasks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "investment_pipeline_follow_ups" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "follow_up_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "owner_user_id" TEXT,
    "due_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investment_pipeline_follow_ups_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "investment_pipeline_decision_audits" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "actor_user_id" TEXT,
    "event_type" TEXT NOT NULL,
    "note" TEXT,
    "metadata_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "investment_pipeline_decision_audits_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "investment_pipeline_deals_listing_id_idx" ON "investment_pipeline_deals"("listing_id");
CREATE INDEX "investment_pipeline_deals_pipeline_stage_idx" ON "investment_pipeline_deals"("pipeline_stage");
CREATE INDEX "investment_pipeline_deals_status_idx" ON "investment_pipeline_deals"("status");
CREATE INDEX "investment_pipeline_deals_owner_user_id_idx" ON "investment_pipeline_deals"("owner_user_id");

CREATE INDEX "investment_pipeline_deal_stage_histories_deal_id_created_at_idx" ON "investment_pipeline_deal_stage_histories"("deal_id", "created_at" DESC);

CREATE INDEX "investment_pipeline_committee_submissions_deal_id_created_at_idx" ON "investment_pipeline_committee_submissions"("deal_id", "created_at" DESC);

CREATE INDEX "investment_pipeline_committee_decisions_deal_id_created_at_idx" ON "investment_pipeline_committee_decisions"("deal_id", "created_at" DESC);

CREATE INDEX "investment_pipeline_conditions_deal_id_status_idx" ON "investment_pipeline_conditions"("deal_id", "status");

CREATE INDEX "investment_pipeline_diligence_tasks_deal_id_status_idx" ON "investment_pipeline_diligence_tasks"("deal_id", "status");

CREATE INDEX "investment_pipeline_follow_ups_deal_id_status_idx" ON "investment_pipeline_follow_ups"("deal_id", "status");

CREATE INDEX "investment_pipeline_decision_audits_deal_id_created_at_idx" ON "investment_pipeline_decision_audits"("deal_id", "created_at" DESC);

ALTER TABLE "investment_pipeline_deals" ADD CONSTRAINT "investment_pipeline_deals_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "investment_pipeline_deals" ADD CONSTRAINT "investment_pipeline_deals_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "investment_pipeline_deals" ADD CONSTRAINT "investment_pipeline_deals_sponsor_user_id_fkey" FOREIGN KEY ("sponsor_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "investment_pipeline_deals" ADD CONSTRAINT "investment_pipeline_deals_latest_memo_id_fkey" FOREIGN KEY ("latest_memo_id") REFERENCES "investor_memos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "investment_pipeline_deals" ADD CONSTRAINT "investment_pipeline_deals_latest_ic_pack_id_fkey" FOREIGN KEY ("latest_ic_pack_id") REFERENCES "investor_ic_packs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "investment_pipeline_deal_stage_histories" ADD CONSTRAINT "investment_pipeline_deal_stage_histories_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "investment_pipeline_deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "investment_pipeline_deal_stage_histories" ADD CONSTRAINT "investment_pipeline_deal_stage_histories_changed_by_user_id_fkey" FOREIGN KEY ("changed_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "investment_pipeline_committee_submissions" ADD CONSTRAINT "investment_pipeline_committee_submissions_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "investment_pipeline_deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "investment_pipeline_committee_submissions" ADD CONSTRAINT "investment_pipeline_committee_submissions_submitted_by_user_id_fkey" FOREIGN KEY ("submitted_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "investment_pipeline_committee_submissions" ADD CONSTRAINT "investment_pipeline_committee_submissions_memo_id_fkey" FOREIGN KEY ("memo_id") REFERENCES "investor_memos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "investment_pipeline_committee_submissions" ADD CONSTRAINT "investment_pipeline_committee_submissions_ic_pack_id_fkey" FOREIGN KEY ("ic_pack_id") REFERENCES "investor_ic_packs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "investment_pipeline_committee_decisions" ADD CONSTRAINT "investment_pipeline_committee_decisions_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "investment_pipeline_deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "investment_pipeline_committee_decisions" ADD CONSTRAINT "investment_pipeline_committee_decisions_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "investment_pipeline_committee_submissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "investment_pipeline_committee_decisions" ADD CONSTRAINT "investment_pipeline_committee_decisions_decided_by_user_id_fkey" FOREIGN KEY ("decided_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "investment_pipeline_conditions" ADD CONSTRAINT "investment_pipeline_conditions_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "investment_pipeline_deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "investment_pipeline_conditions" ADD CONSTRAINT "investment_pipeline_conditions_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "investment_pipeline_conditions" ADD CONSTRAINT "investment_pipeline_conditions_waived_by_user_id_fkey" FOREIGN KEY ("waived_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "investment_pipeline_diligence_tasks" ADD CONSTRAINT "investment_pipeline_diligence_tasks_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "investment_pipeline_deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "investment_pipeline_diligence_tasks" ADD CONSTRAINT "investment_pipeline_diligence_tasks_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "investment_pipeline_diligence_tasks" ADD CONSTRAINT "investment_pipeline_diligence_tasks_linked_condition_id_fkey" FOREIGN KEY ("linked_condition_id") REFERENCES "investment_pipeline_conditions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "investment_pipeline_follow_ups" ADD CONSTRAINT "investment_pipeline_follow_ups_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "investment_pipeline_deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "investment_pipeline_follow_ups" ADD CONSTRAINT "investment_pipeline_follow_ups_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "investment_pipeline_decision_audits" ADD CONSTRAINT "investment_pipeline_decision_audits_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "investment_pipeline_deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "investment_pipeline_decision_audits" ADD CONSTRAINT "investment_pipeline_decision_audits_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
