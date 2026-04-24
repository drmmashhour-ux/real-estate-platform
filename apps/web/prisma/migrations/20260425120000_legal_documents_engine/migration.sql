-- LECIPM legal documents engine: versioned templates, artifacts with snapshots, dispatch audit.

CREATE TYPE "LecipmLegalDocumentTemplateKind" AS ENUM (
  'PROMISE_TO_PURCHASE',
  'COUNTER_PROPOSAL',
  'AMENDMENT',
  'BROKER_DISCLOSURE',
  'CONFLICT_DISCLOSURE',
  'SUBSCRIPTION_AGREEMENT',
  'INVESTOR_MEMO',
  'RISK_DISCLOSURE',
  'EXEMPTION_REPRESENTATION',
  'INVESTOR_QUESTIONNAIRE',
  'DEAL_INVESTOR_HANDOFF_PACKET'
);

CREATE TYPE "LecipmLegalDocumentDomain" AS ENUM (
  'BROKERAGE',
  'INVESTMENT',
  'INTERNAL_HANDOFF'
);

CREATE TYPE "LecipmLegalDocumentArtifactStatus" AS ENUM (
  'DRAFT',
  'AWAITING_APPROVAL',
  'APPROVED',
  'DISPATCHED',
  'ARCHIVED',
  'REJECTED'
);

CREATE TYPE "LecipmLegalDocumentDispatchChannel" AS ENUM (
  'EMAIL',
  'ESIGN_ENVELOPE',
  'SUPPORTING_INTERNAL'
);

CREATE TYPE "LecipmLegalDocumentDispatchStatus" AS ENUM (
  'PENDING',
  'SENT',
  'FAILED',
  'CANCELLED'
);

CREATE TABLE IF NOT EXISTS "lecipm_legal_document_templates" (
    "id" TEXT NOT NULL,
    "kind" "LecipmLegalDocumentTemplateKind" NOT NULL,
    "name" VARCHAR(256) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "lecipm_legal_document_templates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "lecipm_legal_document_templates_kind_key" ON "lecipm_legal_document_templates"("kind");
CREATE INDEX IF NOT EXISTS "lecipm_legal_document_templates_is_active_idx" ON "lecipm_legal_document_templates"("is_active");

CREATE TABLE IF NOT EXISTS "lecipm_legal_document_template_versions" (
    "id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "body_html" TEXT NOT NULL,
    "changelog" TEXT,
    "created_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "lecipm_legal_document_template_versions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "lecipm_legal_document_template_versions_template_id_version_number_key" ON "lecipm_legal_document_template_versions"("template_id", "version_number");
CREATE INDEX IF NOT EXISTS "lecipm_legal_document_template_versions_template_id_idx" ON "lecipm_legal_document_template_versions"("template_id");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lecipm_legal_document_template_versions_template_id_fkey') THEN
    ALTER TABLE "lecipm_legal_document_template_versions"
      ADD CONSTRAINT "lecipm_legal_document_template_versions_template_id_fkey"
      FOREIGN KEY ("template_id") REFERENCES "lecipm_legal_document_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lecipm_legal_document_template_versions_created_by_user_id_fkey') THEN
    ALTER TABLE "lecipm_legal_document_template_versions"
      ADD CONSTRAINT "lecipm_legal_document_template_versions_created_by_user_id_fkey"
      FOREIGN KEY ("created_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "lecipm_legal_document_artifacts" (
    "id" TEXT NOT NULL,
    "template_version_id" TEXT NOT NULL,
    "kind" "LecipmLegalDocumentTemplateKind" NOT NULL,
    "domain" "LecipmLegalDocumentDomain" NOT NULL,
    "deal_id" TEXT,
    "capital_deal_id" VARCHAR(36),
    "source_data_snapshot" JSONB NOT NULL,
    "rendered_html" TEXT NOT NULL,
    "pdf_storage_key" VARCHAR(512),
    "status" "LecipmLegalDocumentArtifactStatus" NOT NULL DEFAULT 'AWAITING_APPROVAL',
    "approved_by_broker_id" TEXT,
    "approved_at" TIMESTAMP(3),
    "investment_compliance_approved_by_id" TEXT,
    "investment_compliance_approved_at" TIMESTAMP(3),
    "signature_session_id" TEXT,
    "created_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "lecipm_legal_document_artifacts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "lecipm_legal_document_artifacts_signature_session_id_key" ON "lecipm_legal_document_artifacts"("signature_session_id");
CREATE INDEX IF NOT EXISTS "lecipm_legal_document_artifacts_deal_id_idx" ON "lecipm_legal_document_artifacts"("deal_id");
CREATE INDEX IF NOT EXISTS "lecipm_legal_document_artifacts_capital_deal_id_idx" ON "lecipm_legal_document_artifacts"("capital_deal_id");
CREATE INDEX IF NOT EXISTS "lecipm_legal_document_artifacts_status_created_at_idx" ON "lecipm_legal_document_artifacts"("status", "created_at");
CREATE INDEX IF NOT EXISTS "lecipm_legal_document_artifacts_kind_idx" ON "lecipm_legal_document_artifacts"("kind");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lecipm_legal_document_artifacts_template_version_id_fkey') THEN
    ALTER TABLE "lecipm_legal_document_artifacts"
      ADD CONSTRAINT "lecipm_legal_document_artifacts_template_version_id_fkey"
      FOREIGN KEY ("template_version_id") REFERENCES "lecipm_legal_document_template_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lecipm_legal_document_artifacts_deal_id_fkey') THEN
    ALTER TABLE "lecipm_legal_document_artifacts"
      ADD CONSTRAINT "lecipm_legal_document_artifacts_deal_id_fkey"
      FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lecipm_legal_document_artifacts_capital_deal_id_fkey') THEN
    ALTER TABLE "lecipm_legal_document_artifacts"
      ADD CONSTRAINT "lecipm_legal_document_artifacts_capital_deal_id_fkey"
      FOREIGN KEY ("capital_deal_id") REFERENCES "amf_capital_deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lecipm_legal_document_artifacts_approved_by_broker_id_fkey') THEN
    ALTER TABLE "lecipm_legal_document_artifacts"
      ADD CONSTRAINT "lecipm_legal_document_artifacts_approved_by_broker_id_fkey"
      FOREIGN KEY ("approved_by_broker_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lecipm_legal_document_artifacts_investment_compliance_approved_by_id_fkey') THEN
    ALTER TABLE "lecipm_legal_document_artifacts"
      ADD CONSTRAINT "lecipm_legal_document_artifacts_investment_compliance_approved_by_id_fkey"
      FOREIGN KEY ("investment_compliance_approved_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lecipm_legal_document_artifacts_signature_session_id_fkey') THEN
    ALTER TABLE "lecipm_legal_document_artifacts"
      ADD CONSTRAINT "lecipm_legal_document_artifacts_signature_session_id_fkey"
      FOREIGN KEY ("signature_session_id") REFERENCES "signature_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lecipm_legal_document_artifacts_created_by_user_id_fkey') THEN
    ALTER TABLE "lecipm_legal_document_artifacts"
      ADD CONSTRAINT "lecipm_legal_document_artifacts_created_by_user_id_fkey"
      FOREIGN KEY ("created_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "lecipm_legal_document_dispatches" (
    "id" TEXT NOT NULL,
    "artifact_id" TEXT NOT NULL,
    "channel" "LecipmLegalDocumentDispatchChannel" NOT NULL,
    "status" "LecipmLegalDocumentDispatchStatus" NOT NULL DEFAULT 'PENDING',
    "target_summary" JSONB NOT NULL DEFAULT '{}',
    "error_message" TEXT,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "lecipm_legal_document_dispatches_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "lecipm_legal_document_dispatches_artifact_id_idx" ON "lecipm_legal_document_dispatches"("artifact_id");
CREATE INDEX IF NOT EXISTS "lecipm_legal_document_dispatches_status_idx" ON "lecipm_legal_document_dispatches"("status");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lecipm_legal_document_dispatches_artifact_id_fkey') THEN
    ALTER TABLE "lecipm_legal_document_dispatches"
      ADD CONSTRAINT "lecipm_legal_document_dispatches_artifact_id_fkey"
      FOREIGN KEY ("artifact_id") REFERENCES "lecipm_legal_document_artifacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
