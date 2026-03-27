-- Legal workflow lifecycle/version/audit/signature
DO $$ BEGIN
  ALTER TYPE "SellerDeclarationDraftStatus" ADD VALUE IF NOT EXISTS 'approved';
  ALTER TYPE "SellerDeclarationDraftStatus" ADD VALUE IF NOT EXISTS 'exported';
  ALTER TYPE "SellerDeclarationDraftStatus" ADD VALUE IF NOT EXISTS 'signed';
EXCEPTION WHEN undefined_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "DocumentSignatureStatus" AS ENUM ('pending','viewed','signed','declined');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "document_versions" (
  "id" TEXT PRIMARY KEY,
  "document_id" TEXT NOT NULL,
  "version_number" INTEGER NOT NULL,
  "payload" JSONB NOT NULL,
  "created_by" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  CONSTRAINT "document_versions_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "seller_declaration_drafts"("id") ON DELETE CASCADE,
  CONSTRAINT "uq_document_versions_doc_version" UNIQUE ("document_id", "version_number")
);
CREATE INDEX IF NOT EXISTS "document_versions_document_id_idx" ON "document_versions"("document_id");
CREATE INDEX IF NOT EXISTS "document_versions_created_by_idx" ON "document_versions"("created_by");

CREATE TABLE IF NOT EXISTS "document_audit_logs" (
  "id" TEXT PRIMARY KEY,
  "document_id" TEXT NOT NULL,
  "actor_user_id" TEXT NOT NULL,
  "action_type" TEXT NOT NULL,
  "metadata" JSONB,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  CONSTRAINT "document_audit_logs_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "seller_declaration_drafts"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "document_audit_logs_document_id_idx" ON "document_audit_logs"("document_id");
CREATE INDEX IF NOT EXISTS "document_audit_logs_actor_user_id_idx" ON "document_audit_logs"("actor_user_id");
CREATE INDEX IF NOT EXISTS "document_audit_logs_action_type_idx" ON "document_audit_logs"("action_type");

CREATE TABLE IF NOT EXISTS "document_signatures" (
  "id" TEXT PRIMARY KEY,
  "document_id" TEXT NOT NULL,
  "signer_name" TEXT NOT NULL,
  "signer_email" TEXT NOT NULL,
  "status" "DocumentSignatureStatus" NOT NULL DEFAULT 'pending',
  "signed_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  CONSTRAINT "document_signatures_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "seller_declaration_drafts"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "document_signatures_document_id_idx" ON "document_signatures"("document_id");
CREATE INDEX IF NOT EXISTS "document_signatures_status_idx" ON "document_signatures"("status");
