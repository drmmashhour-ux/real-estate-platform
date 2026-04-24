-- LECIPM ProductionGuard: notice acknowledgments, audit trail, final artifact hashes.

CREATE TABLE "lecipm_production_guard_notice_acks" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "notice_id" VARCHAR(96) NOT NULL,
    "acknowledged_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lecipm_production_guard_notice_acks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "lecipm_production_guard_notice_acks_deal_id_user_id_notice_id_key" ON "lecipm_production_guard_notice_acks"("deal_id", "user_id", "notice_id");

CREATE INDEX "lecipm_production_guard_notice_acks_deal_id_user_id_idx" ON "lecipm_production_guard_notice_acks"("deal_id", "user_id");

ALTER TABLE "lecipm_production_guard_notice_acks" ADD CONSTRAINT "lecipm_production_guard_notice_acks_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lecipm_production_guard_notice_acks" ADD CONSTRAINT "lecipm_production_guard_notice_acks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "lecipm_production_guard_audit_events" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT,
    "actor_user_id" TEXT,
    "action" VARCHAR(96) NOT NULL,
    "entity_type" VARCHAR(64),
    "entity_id" VARCHAR(64),
    "diff" JSONB,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lecipm_production_guard_audit_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lecipm_production_guard_audit_events_deal_id_created_at_idx" ON "lecipm_production_guard_audit_events"("deal_id", "created_at");

CREATE INDEX "lecipm_production_guard_audit_events_action_created_at_idx" ON "lecipm_production_guard_audit_events"("action", "created_at");

ALTER TABLE "lecipm_production_guard_audit_events" ADD CONSTRAINT "lecipm_production_guard_audit_events_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lecipm_production_guard_audit_events" ADD CONSTRAINT "lecipm_production_guard_audit_events_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "lecipm_production_guard_artifacts" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "deal_document_id" TEXT,
    "kind" VARCHAR(32) NOT NULL,
    "content_sha256" VARCHAR(64) NOT NULL,
    "pdf_sha256" VARCHAR(64),
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lecipm_production_guard_artifacts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lecipm_production_guard_artifacts_deal_id_created_at_idx" ON "lecipm_production_guard_artifacts"("deal_id", "created_at");

CREATE INDEX "lecipm_production_guard_artifacts_content_sha256_idx" ON "lecipm_production_guard_artifacts"("content_sha256");

ALTER TABLE "lecipm_production_guard_artifacts" ADD CONSTRAINT "lecipm_production_guard_artifacts_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lecipm_production_guard_artifacts" ADD CONSTRAINT "lecipm_production_guard_artifacts_deal_document_id_fkey" FOREIGN KEY ("deal_document_id") REFERENCES "deal_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "lecipm_production_guard_artifacts" ADD CONSTRAINT "lecipm_production_guard_artifacts_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
