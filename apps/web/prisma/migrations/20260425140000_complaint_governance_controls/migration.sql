-- LECIPM complaint governance: written policy record, classification reviews, CAPA, structured escalation suggestions, case fields (additive)

ALTER TABLE "complaint_cases" ADD COLUMN "complainant_relation" TEXT;
ALTER TABLE "complaint_cases" ADD COLUMN "consent_to_be_contacted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "complaint_cases" ADD COLUMN "preferred_resolution" TEXT;
ALTER TABLE "complaint_cases" ADD COLUMN "resolution_note" TEXT;
ALTER TABLE "complaint_cases" ADD COLUMN "consumer_protection_explained_at" TIMESTAMP(3);
ALTER TABLE "complaint_cases" ADD COLUMN "evidence_document_ids" JSONB;
ALTER TABLE "complaint_cases" ADD COLUMN "assigned_owner_user_id" TEXT;
ALTER TABLE "complaint_cases" ADD COLUMN "linked_employee_user_id" TEXT;
ALTER TABLE "complaint_cases" ADD COLUMN "linked_compliance_case_id" TEXT;

CREATE INDEX "idx_complaint_case_assigned_owner" ON "complaint_cases"("assigned_owner_user_id");

ALTER TABLE "complaint_cases" ADD CONSTRAINT "complaint_cases_assigned_owner_user_id_fkey" FOREIGN KEY ("assigned_owner_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "complaint_written_policy_records" (
    "id" TEXT NOT NULL,
    "owner_type" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "document_url" TEXT,
    "policy_summary" TEXT NOT NULL,
    "version_label" VARCHAR(64),
    "effective_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "complaint_written_policy_records_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uq_complaint_written_policy_owner" ON "complaint_written_policy_records"("owner_type", "owner_id");

CREATE TABLE "complaint_classification_reviews" (
    "id" TEXT NOT NULL,
    "complaint_case_id" TEXT NOT NULL,
    "initial_classification" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "plausible_compliance_categories" JSONB NOT NULL DEFAULT '[]',
    "requires_manual_review" BOOLEAN NOT NULL DEFAULT false,
    "requires_consumer_protection_explanation" BOOLEAN NOT NULL DEFAULT false,
    "suggest_public_assistance_referral" BOOLEAN NOT NULL DEFAULT false,
    "suggest_syndic_referral" BOOLEAN NOT NULL DEFAULT false,
    "reviewer_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "complaint_classification_reviews_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_complaint_classification_case" ON "complaint_classification_reviews"("complaint_case_id");

ALTER TABLE "complaint_classification_reviews" ADD CONSTRAINT "complaint_classification_reviews_complaint_case_id_fkey" FOREIGN KEY ("complaint_case_id") REFERENCES "complaint_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "complaint_classification_reviews" ADD CONSTRAINT "complaint_classification_reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "complaint_corrective_action_plans" (
    "id" TEXT NOT NULL,
    "complaint_case_id" TEXT NOT NULL,
    "root_cause_summary" TEXT NOT NULL,
    "corrective_actions" JSONB NOT NULL DEFAULT '[]',
    "preventive_actions" JSONB NOT NULL DEFAULT '[]',
    "owner_user_id" TEXT NOT NULL,
    "due_date" DATE,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "complaint_corrective_action_plans_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_complaint_capa_case" ON "complaint_corrective_action_plans"("complaint_case_id");

ALTER TABLE "complaint_corrective_action_plans" ADD CONSTRAINT "complaint_corrective_action_plans_complaint_case_id_fkey" FOREIGN KEY ("complaint_case_id") REFERENCES "complaint_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "complaint_corrective_action_plans" ADD CONSTRAINT "complaint_corrective_action_plans_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "complaint_escalation_suggestions" (
    "id" TEXT NOT NULL,
    "complaint_case_id" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "recommended" BOOLEAN NOT NULL DEFAULT true,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "created_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "complaint_escalation_suggestions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_complaint_escalation_case" ON "complaint_escalation_suggestions"("complaint_case_id");
CREATE INDEX "idx_complaint_escalation_destination" ON "complaint_escalation_suggestions"("destination");

ALTER TABLE "complaint_escalation_suggestions" ADD CONSTRAINT "complaint_escalation_suggestions_complaint_case_id_fkey" FOREIGN KEY ("complaint_case_id") REFERENCES "complaint_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "complaint_escalation_suggestions" ADD CONSTRAINT "complaint_escalation_suggestions_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
