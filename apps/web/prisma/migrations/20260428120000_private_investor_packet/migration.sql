-- Private investor packet (broker-reviewed private placement; auditable versions).

CREATE TABLE "private_investor_packets" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "investor_id" TEXT NOT NULL,
    "spv_id" TEXT,
    "status" VARCHAR(24) NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "packet_summary_json" JSONB NOT NULL,
    "html_bundle" TEXT,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_at" TIMESTAMP(3),
    "approved_by_broker_id" TEXT,
    "approval_snapshot_json" JSONB,
    "released_at" TIMESTAMP(3),
    "released_by_broker_id" TEXT,
    "broker_attestation_text" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "private_investor_packets_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "private_investor_packets_deal_id_investor_id_idx" ON "private_investor_packets"("deal_id", "investor_id");
CREATE INDEX "private_investor_packets_deal_id_status_idx" ON "private_investor_packets"("deal_id", "status");

ALTER TABLE "private_investor_packets" ADD CONSTRAINT "private_investor_packets_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "private_investor_packets" ADD CONSTRAINT "private_investor_packets_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "private_investor_packets" ADD CONSTRAINT "private_investor_packets_spv_id_fkey" FOREIGN KEY ("spv_id") REFERENCES "amf_spvs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "private_investor_packets" ADD CONSTRAINT "private_investor_packets_approved_by_broker_id_fkey" FOREIGN KEY ("approved_by_broker_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "private_investor_packets" ADD CONSTRAINT "private_investor_packets_released_by_broker_id_fkey" FOREIGN KEY ("released_by_broker_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "private_investor_packet_documents" (
    "id" TEXT NOT NULL,
    "packet_id" TEXT NOT NULL,
    "document_type" VARCHAR(48) NOT NULL,
    "document_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "private_investor_packet_documents_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "private_investor_packet_documents_packet_id_idx" ON "private_investor_packet_documents"("packet_id");
CREATE INDEX "private_investor_packet_documents_document_id_idx" ON "private_investor_packet_documents"("document_id");

ALTER TABLE "private_investor_packet_documents" ADD CONSTRAINT "private_investor_packet_documents_packet_id_fkey" FOREIGN KEY ("packet_id") REFERENCES "private_investor_packets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "private_investor_packet_documents" ADD CONSTRAINT "private_investor_packet_documents_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "deal_documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "private_investor_packet_audit_logs" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "packet_id" TEXT,
    "investor_id" TEXT,
    "actor_user_id" TEXT,
    "action" VARCHAR(64) NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "private_investor_packet_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "private_investor_packet_audit_logs_deal_id_created_at_idx" ON "private_investor_packet_audit_logs"("deal_id", "created_at");
CREATE INDEX "private_investor_packet_audit_logs_packet_id_idx" ON "private_investor_packet_audit_logs"("packet_id");
CREATE INDEX "private_investor_packet_audit_logs_action_idx" ON "private_investor_packet_audit_logs"("action");

ALTER TABLE "private_investor_packet_audit_logs" ADD CONSTRAINT "private_investor_packet_audit_logs_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "private_investor_packet_audit_logs" ADD CONSTRAINT "private_investor_packet_audit_logs_packet_id_fkey" FOREIGN KEY ("packet_id") REFERENCES "private_investor_packets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "private_investor_packet_audit_logs" ADD CONSTRAINT "private_investor_packet_audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "private_investor_packet_engagements" (
    "id" TEXT NOT NULL,
    "packet_id" TEXT NOT NULL,
    "investor_id" TEXT NOT NULL,
    "event_type" VARCHAR(32) NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "private_investor_packet_engagements_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "private_investor_packet_engagements_packet_id_event_type_idx" ON "private_investor_packet_engagements"("packet_id", "event_type");
CREATE INDEX "private_investor_packet_engagements_investor_id_created_at_idx" ON "private_investor_packet_engagements"("investor_id", "created_at");

ALTER TABLE "private_investor_packet_engagements" ADD CONSTRAINT "private_investor_packet_engagements_packet_id_fkey" FOREIGN KEY ("packet_id") REFERENCES "private_investor_packets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "private_investor_packet_engagements" ADD CONSTRAINT "private_investor_packet_engagements_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
