-- Phase 3 — Digital signatures, compliance checks, tamper-evident audit chain.

ALTER TABLE "lecipm_sd_documents" ADD COLUMN IF NOT EXISTS "locked_at" TIMESTAMP(3);
ALTER TABLE "lecipm_sd_documents" ADD COLUMN IF NOT EXISTS "immutable_content_hash" VARCHAR(128);

CREATE TABLE "lecipm_sd_signature_packets" (
    "id" TEXT NOT NULL,
    "transaction_id" VARCHAR(36) NOT NULL,
    "document_id" VARCHAR(36) NOT NULL,
    "status" VARCHAR(28) NOT NULL DEFAULT 'DRAFT',
    "provider" VARCHAR(32) NOT NULL DEFAULT 'INTERNAL',
    "sent_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lecipm_sd_signature_packets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "lecipm_sd_signature_signers" (
    "id" TEXT NOT NULL,
    "packet_id" VARCHAR(36) NOT NULL,
    "transaction_id" VARCHAR(36) NOT NULL,
    "role" VARCHAR(24) NOT NULL,
    "name" VARCHAR(512) NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "status" VARCHAR(24) NOT NULL DEFAULT 'PENDING',
    "signed_at" TIMESTAMP(3),
    "ip_address" VARCHAR(64),
    "user_agent" TEXT,
    "signature_hash" VARCHAR(128),
    "identity_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lecipm_sd_signature_signers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "lecipm_sd_compliance_checks" (
    "id" TEXT NOT NULL,
    "transaction_id" VARCHAR(36) NOT NULL,
    "document_id" VARCHAR(36),
    "check_type" VARCHAR(40) NOT NULL,
    "severity" VARCHAR(16) NOT NULL,
    "status" VARCHAR(16) NOT NULL DEFAULT 'OPEN',
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lecipm_sd_compliance_checks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "lecipm_sd_audit_proofs" (
    "id" TEXT NOT NULL,
    "transaction_id" VARCHAR(36) NOT NULL,
    "document_id" VARCHAR(36),
    "hash" VARCHAR(128) NOT NULL,
    "previous_hash" VARCHAR(128),
    "event_type" VARCHAR(64) NOT NULL,
    "payload_json" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lecipm_sd_audit_proofs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lecipm_sd_signature_packets_transaction_id_idx" ON "lecipm_sd_signature_packets"("transaction_id");
CREATE INDEX "lecipm_sd_signature_packets_document_id_idx" ON "lecipm_sd_signature_packets"("document_id");
CREATE INDEX "lecipm_sd_signature_signers_packet_id_idx" ON "lecipm_sd_signature_signers"("packet_id");
CREATE INDEX "lecipm_sd_signature_signers_transaction_id_idx" ON "lecipm_sd_signature_signers"("transaction_id");
CREATE INDEX "lecipm_sd_compliance_checks_transaction_id_status_idx" ON "lecipm_sd_compliance_checks"("transaction_id", "status");
CREATE INDEX "lecipm_sd_audit_proofs_transaction_id_timestamp_idx" ON "lecipm_sd_audit_proofs"("transaction_id", "timestamp");

ALTER TABLE "lecipm_sd_signature_packets" ADD CONSTRAINT "lecipm_sd_signature_packets_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "lecipm_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lecipm_sd_signature_packets" ADD CONSTRAINT "lecipm_sd_signature_packets_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "lecipm_sd_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lecipm_sd_signature_signers" ADD CONSTRAINT "lecipm_sd_signature_signers_packet_id_fkey" FOREIGN KEY ("packet_id") REFERENCES "lecipm_sd_signature_packets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lecipm_sd_signature_signers" ADD CONSTRAINT "lecipm_sd_signature_signers_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "lecipm_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lecipm_sd_compliance_checks" ADD CONSTRAINT "lecipm_sd_compliance_checks_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "lecipm_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lecipm_sd_compliance_checks" ADD CONSTRAINT "lecipm_sd_compliance_checks_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "lecipm_sd_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "lecipm_sd_audit_proofs" ADD CONSTRAINT "lecipm_sd_audit_proofs_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "lecipm_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lecipm_sd_audit_proofs" ADD CONSTRAINT "lecipm_sd_audit_proofs_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "lecipm_sd_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
