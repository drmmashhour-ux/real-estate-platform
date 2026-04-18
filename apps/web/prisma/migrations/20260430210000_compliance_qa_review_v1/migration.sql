-- Admin compliance command center + brokerage QA review (internal; not legal determinations).

CREATE TYPE "ComplianceCaseType" AS ENUM (
  'missing_disclosure',
  'representation_risk',
  'document_inconsistency',
  'execution_readiness_risk',
  'communication_compliance_risk',
  'payment_workflow_risk',
  'closing_readiness_risk',
  'suspicious_activity_internal'
);

CREATE TYPE "ComplianceCaseSeverity" AS ENUM ('low', 'medium', 'high', 'critical');

CREATE TYPE "ComplianceCaseStatus" AS ENUM (
  'open',
  'under_review',
  'action_required',
  'resolved',
  'dismissed',
  'escalated',
  'archived'
);

CREATE TYPE "QaReviewType" AS ENUM (
  'pre_execution_review',
  'document_quality_review',
  'communication_compliance_review',
  'closing_readiness_review',
  'spot_audit',
  'supervisor_review'
);

CREATE TYPE "QaReviewStatus" AS ENUM ('draft', 'pending', 'in_progress', 'completed', 'cancelled');

CREATE TYPE "QaReviewOutcome" AS ENUM (
  'approved',
  'approved_with_notes',
  'changes_required',
  'escalated',
  'rejected'
);

CREATE TYPE "QaChecklistItemStatus" AS ENUM ('pending', 'passed', 'failed', 'skipped');

CREATE TYPE "ComplianceEscalationType" AS ENUM ('supervisory', 'legal', 'risk', 'operations');

CREATE TYPE "ComplianceEscalationTargetRole" AS ENUM ('reviewer', 'supervisor', 'admin', 'compliance_officer');

CREATE TYPE "ComplianceEscalationStatus" AS ENUM ('open', 'acknowledged', 'resolved', 'cancelled');

CREATE TABLE "compliance_cases" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT,
    "document_id" TEXT,
    "listing_id" TEXT,
    "lecipm_contact_id" TEXT,
    "case_type" "ComplianceCaseType" NOT NULL,
    "severity" "ComplianceCaseSeverity" NOT NULL,
    "status" "ComplianceCaseStatus" NOT NULL DEFAULT 'open',
    "summary" TEXT NOT NULL,
    "findings" JSONB NOT NULL DEFAULT '{}',
    "opened_by_system" BOOLEAN NOT NULL DEFAULT true,
    "assigned_reviewer_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compliance_cases_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "compliance_findings" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "finding_type" VARCHAR(64) NOT NULL,
    "severity" "ComplianceCaseSeverity" NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "summary" TEXT NOT NULL,
    "affected_entity_type" VARCHAR(32),
    "affected_entity_id" TEXT,
    "source_refs" JSONB NOT NULL DEFAULT '[]',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compliance_findings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "qa_reviews" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT,
    "document_id" TEXT,
    "review_type" "QaReviewType" NOT NULL,
    "status" "QaReviewStatus" NOT NULL DEFAULT 'pending',
    "assigned_to_user_id" TEXT,
    "requested_by_user_id" TEXT,
    "outcome" "QaReviewOutcome",
    "notes" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "qa_reviews_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "qa_review_checklist_items" (
    "id" TEXT NOT NULL,
    "review_id" TEXT NOT NULL,
    "item_key" VARCHAR(96) NOT NULL,
    "item_label" VARCHAR(200) NOT NULL,
    "status" "QaChecklistItemStatus" NOT NULL DEFAULT 'pending',
    "reviewer_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "qa_review_checklist_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "compliance_escalations" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "escalation_type" "ComplianceEscalationType" NOT NULL,
    "target_role" "ComplianceEscalationTargetRole" NOT NULL,
    "status" "ComplianceEscalationStatus" NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compliance_escalations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "compliance_audit_logs" (
    "id" TEXT NOT NULL,
    "actor_user_id" TEXT NOT NULL,
    "action_key" VARCHAR(96) NOT NULL,
    "case_id" TEXT,
    "review_id" TEXT,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compliance_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "compliance_cases_deal_id_idx" ON "compliance_cases"("deal_id");
CREATE INDEX "compliance_cases_status_idx" ON "compliance_cases"("status");
CREATE INDEX "compliance_cases_severity_idx" ON "compliance_cases"("severity");
CREATE INDEX "compliance_cases_case_type_idx" ON "compliance_cases"("case_type");
CREATE INDEX "compliance_cases_assigned_reviewer_id_idx" ON "compliance_cases"("assigned_reviewer_id");

CREATE INDEX "compliance_findings_case_id_idx" ON "compliance_findings"("case_id");

CREATE INDEX "qa_reviews_deal_id_idx" ON "qa_reviews"("deal_id");
CREATE INDEX "qa_reviews_status_idx" ON "qa_reviews"("status");
CREATE INDEX "qa_reviews_review_type_idx" ON "qa_reviews"("review_type");

CREATE INDEX "qa_review_checklist_items_review_id_idx" ON "qa_review_checklist_items"("review_id");

CREATE INDEX "compliance_escalations_case_id_idx" ON "compliance_escalations"("case_id");
CREATE INDEX "compliance_escalations_status_idx" ON "compliance_escalations"("status");

CREATE INDEX "compliance_audit_logs_actor_user_id_created_at_idx" ON "compliance_audit_logs"("actor_user_id", "created_at");
CREATE INDEX "compliance_audit_logs_action_key_idx" ON "compliance_audit_logs"("action_key");

ALTER TABLE "compliance_cases" ADD CONSTRAINT "compliance_cases_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "compliance_cases" ADD CONSTRAINT "compliance_cases_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "deal_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "compliance_cases" ADD CONSTRAINT "compliance_cases_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "compliance_cases" ADD CONSTRAINT "compliance_cases_lecipm_contact_id_fkey" FOREIGN KEY ("lecipm_contact_id") REFERENCES "lecipm_crm_contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "compliance_cases" ADD CONSTRAINT "compliance_cases_assigned_reviewer_id_fkey" FOREIGN KEY ("assigned_reviewer_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "compliance_findings" ADD CONSTRAINT "compliance_findings_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "compliance_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "qa_reviews" ADD CONSTRAINT "qa_reviews_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "qa_reviews" ADD CONSTRAINT "qa_reviews_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "deal_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "qa_reviews" ADD CONSTRAINT "qa_reviews_assigned_to_user_id_fkey" FOREIGN KEY ("assigned_to_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "qa_reviews" ADD CONSTRAINT "qa_reviews_requested_by_user_id_fkey" FOREIGN KEY ("requested_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "qa_review_checklist_items" ADD CONSTRAINT "qa_review_checklist_items_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "qa_reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "compliance_escalations" ADD CONSTRAINT "compliance_escalations_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "compliance_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "compliance_audit_logs" ADD CONSTRAINT "compliance_audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "compliance_audit_logs" ADD CONSTRAINT "compliance_audit_logs_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "compliance_cases"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "compliance_audit_logs" ADD CONSTRAINT "compliance_audit_logs_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "qa_reviews"("id") ON DELETE SET NULL ON UPDATE CASCADE;
