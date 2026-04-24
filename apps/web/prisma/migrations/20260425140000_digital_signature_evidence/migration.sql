-- Evidentiary digital signatures on legal document artifacts (Québec-oriented audit trail).

CREATE TYPE "DigitalSignatureSignerRole" AS ENUM ('BROKER', 'CLIENT');
CREATE TYPE "DigitalSignatureCaptureType" AS ENUM ('CLICK', 'DRAWN');

CREATE TABLE IF NOT EXISTS "digital_signatures" (
    "id" TEXT NOT NULL,
    "legal_document_artifact_id" TEXT NOT NULL,
    "signed_by_user_id" TEXT NOT NULL,
    "signer_role" "DigitalSignatureSignerRole" NOT NULL,
    "signature_type" "DigitalSignatureCaptureType" NOT NULL,
    "ip_address" VARCHAR(64),
    "user_agent" VARCHAR(512),
    "document_hash" VARCHAR(128) NOT NULL,
    "record_hash" VARCHAR(128) NOT NULL,
    "template_version_number" INTEGER NOT NULL,
    "consent_text_version" VARCHAR(48) NOT NULL DEFAULT 'v1_qc_esig_2026',
    "consent_acknowledged" BOOLEAN NOT NULL,
    "drawn_payload" JSONB,
    "signed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "digital_signatures_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "digital_signatures_legal_document_artifact_id_idx" ON "digital_signatures"("legal_document_artifact_id");
CREATE INDEX IF NOT EXISTS "digital_signatures_signed_by_user_id_signed_at_idx" ON "digital_signatures"("signed_by_user_id", "signed_at");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'digital_signatures_legal_document_artifact_id_fkey') THEN
    ALTER TABLE "digital_signatures"
      ADD CONSTRAINT "digital_signatures_legal_document_artifact_id_fkey"
      FOREIGN KEY ("legal_document_artifact_id") REFERENCES "lecipm_legal_document_artifacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'digital_signatures_signed_by_user_id_fkey') THEN
    ALTER TABLE "digital_signatures"
      ADD CONSTRAINT "digital_signatures_signed_by_user_id_fkey"
      FOREIGN KEY ("signed_by_user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "digital_signature_audit_events" (
    "id" TEXT NOT NULL,
    "digital_signature_id" TEXT NOT NULL,
    "event_key" VARCHAR(64) NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "ip_address" VARCHAR(64),
    "user_agent" VARCHAR(512),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "digital_signature_audit_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "digital_signature_audit_events_digital_signature_id_created_at_idx" ON "digital_signature_audit_events"("digital_signature_id", "created_at");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'digital_signature_audit_events_digital_signature_id_fkey') THEN
    ALTER TABLE "digital_signature_audit_events"
      ADD CONSTRAINT "digital_signature_audit_events_digital_signature_id_fkey"
      FOREIGN KEY ("digital_signature_id") REFERENCES "digital_signatures"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE "lecipm_legal_document_artifacts" ADD COLUMN IF NOT EXISTS "locked_pdf_bytes" BYTEA;
ALTER TABLE "lecipm_legal_document_artifacts" ADD COLUMN IF NOT EXISTS "locked_pdf_generated_at" TIMESTAMP(3);
