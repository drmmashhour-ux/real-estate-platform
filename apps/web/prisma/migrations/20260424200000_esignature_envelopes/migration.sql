-- LECIPM native e-signature envelopes (transaction documents; not notarial deed replacement)

CREATE TABLE "signature_envelopes" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "source_document_id" VARCHAR(36) NOT NULL,
    "source_document_kind" VARCHAR(32) NOT NULL,
    "title" VARCHAR(512) NOT NULL DEFAULT 'Transaction documents',
    "status" VARCHAR(24) NOT NULL DEFAULT 'DRAFT',
    "document_hash_sha256" VARCHAR(64),
    "hash_computed_at" TIMESTAMP(3),
    "source_version_locked_at" TIMESTAMP(3),
    "document_hash_before_finalize_sha256" VARCHAR(64),
    "canonical_pdf_url" TEXT,
    "final_pdf_url" TEXT,
    "audit_trail_pdf_url" TEXT,
    "approved_by_broker_id" VARCHAR(36),
    "approved_at" TIMESTAMP(3),
    "broker_signing_configured_at" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_by_user_id" VARCHAR(36),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "signature_envelopes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "signature_envelope_participants" (
    "id" TEXT NOT NULL,
    "envelope_id" TEXT NOT NULL,
    "signer_role" VARCHAR(32) NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "display_name" VARCHAR(256) NOT NULL,
    "routing_order" INTEGER NOT NULL DEFAULT 1,
    "user_id" VARCHAR(36),
    "consent_accepted_at" TIMESTAMP(3),
    "signer_name_confirmed" VARCHAR(256),
    "email_verified_at" TIMESTAMP(3),
    "otp_verified_at" TIMESTAMP(3),
    "requires_otp" BOOLEAN NOT NULL DEFAULT false,
    "otp_code_hash" VARCHAR(64),
    "viewed_document_at" TIMESTAMP(3),
    "signed_at" TIMESTAMP(3),
    "ip_address" VARCHAR(64),
    "user_agent" TEXT,
    "status" VARCHAR(24) NOT NULL DEFAULT 'PENDING',
    "access_token_hash" VARCHAR(64),

    CONSTRAINT "signature_envelope_participants_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "signature_envelope_events" (
    "id" TEXT NOT NULL,
    "envelope_id" TEXT NOT NULL,
    "event_type" VARCHAR(48) NOT NULL,
    "actor_user_id" VARCHAR(36),
    "actor_email" VARCHAR(320),
    "ip_address" VARCHAR(64),
    "user_agent" TEXT,
    "document_hash_sha256" VARCHAR(64),
    "metadata_json" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "signature_envelope_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "signed_document_versions" (
    "id" TEXT NOT NULL,
    "envelope_id" TEXT NOT NULL,
    "version_kind" VARCHAR(24) NOT NULL,
    "document_hash_sha256" VARCHAR(64) NOT NULL,
    "pdf_url" TEXT,
    "immutable" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "signed_document_versions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "signature_envelopes_deal_id_status_idx" ON "signature_envelopes"("deal_id", "status");
CREATE INDEX "signature_envelopes_deal_id_created_at_idx" ON "signature_envelopes"("deal_id", "created_at" DESC);

CREATE INDEX "signature_envelope_participants_envelope_id_idx" ON "signature_envelope_participants"("envelope_id");
CREATE INDEX "signature_envelope_participants_envelope_id_routing_order_idx" ON "signature_envelope_participants"("envelope_id", "routing_order");

CREATE INDEX "signature_envelope_events_envelope_id_created_at_idx" ON "signature_envelope_events"("envelope_id", "created_at");

CREATE INDEX "signed_document_versions_envelope_id_idx" ON "signed_document_versions"("envelope_id");

ALTER TABLE "signature_envelopes" ADD CONSTRAINT "signature_envelopes_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "signature_envelopes" ADD CONSTRAINT "signature_envelopes_approved_by_broker_id_fkey" FOREIGN KEY ("approved_by_broker_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "signature_envelopes" ADD CONSTRAINT "signature_envelopes_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "signature_envelope_participants" ADD CONSTRAINT "signature_envelope_participants_envelope_id_fkey" FOREIGN KEY ("envelope_id") REFERENCES "signature_envelopes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "signature_envelope_participants" ADD CONSTRAINT "signature_envelope_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "signature_envelope_events" ADD CONSTRAINT "signature_envelope_events_envelope_id_fkey" FOREIGN KEY ("envelope_id") REFERENCES "signature_envelopes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "signed_document_versions" ADD CONSTRAINT "signed_document_versions_envelope_id_fkey" FOREIGN KEY ("envelope_id") REFERENCES "signature_envelopes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
