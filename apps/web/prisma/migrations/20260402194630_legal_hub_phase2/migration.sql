-- Legal Hub Phase 2 — submission documents, workflow submissions, audit trail (explicit review only).

CREATE TABLE "legal_workflow_submissions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "actor_type" TEXT NOT NULL,
    "workflow_type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "submitted_at" TIMESTAMP(3),
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "legal_workflow_submissions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "legal_hub_submission_documents" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "actor_type" TEXT NOT NULL,
    "workflow_type" TEXT NOT NULL,
    "requirement_id" TEXT NOT NULL,
    "workflow_submission_id" TEXT,
    "file_url" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submitted_at" TIMESTAMP(3),
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by" TEXT,
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "legal_hub_submission_documents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "legal_audit_logs" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actor_id" TEXT,
    "actor_type" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "legal_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "legal_workflow_submissions_user_id_workflow_type_key" ON "legal_workflow_submissions"("user_id", "workflow_type");

CREATE INDEX "legal_workflow_submissions_status_idx" ON "legal_workflow_submissions"("status");

CREATE INDEX "legal_hub_submission_documents_user_id_idx" ON "legal_hub_submission_documents"("user_id");

CREATE INDEX "legal_hub_submission_documents_workflow_type_user_id_idx" ON "legal_hub_submission_documents"("workflow_type", "user_id");

CREATE INDEX "legal_hub_submission_documents_status_idx" ON "legal_hub_submission_documents"("status");

CREATE INDEX "legal_hub_submission_documents_workflow_submission_id_idx" ON "legal_hub_submission_documents"("workflow_submission_id");

CREATE INDEX "legal_audit_logs_entity_type_entity_id_idx" ON "legal_audit_logs"("entity_type", "entity_id");

CREATE INDEX "legal_audit_logs_created_at_idx" ON "legal_audit_logs"("created_at");

ALTER TABLE "legal_workflow_submissions" ADD CONSTRAINT "legal_workflow_submissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "legal_hub_submission_documents" ADD CONSTRAINT "legal_hub_submission_documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "legal_hub_submission_documents" ADD CONSTRAINT "legal_hub_submission_documents_workflow_submission_id_fkey" FOREIGN KEY ("workflow_submission_id") REFERENCES "legal_workflow_submissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
