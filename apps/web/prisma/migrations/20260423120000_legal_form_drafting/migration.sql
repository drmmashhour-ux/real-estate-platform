-- AI-assisted legal drafting (broker-controlled; assistive only)

CREATE TABLE "legal_form_templates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "version" TEXT,
    "schema_json" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "legal_form_templates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "legal_form_templates_key_key" ON "legal_form_templates"("key");

CREATE TABLE "legal_form_drafts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "template_id" UUID NOT NULL,
    "listing_id" TEXT,
    "broker_user_id" TEXT NOT NULL,
    "client_user_id" TEXT,
    "language" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "field_values_json" JSONB NOT NULL,
    "alerts_json" JSONB NOT NULL DEFAULT '{}',
    "ai_summary" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "legal_form_drafts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "legal_form_drafts_template_id_idx" ON "legal_form_drafts"("template_id");
CREATE INDEX "legal_form_drafts_listing_id_idx" ON "legal_form_drafts"("listing_id");
CREATE INDEX "legal_form_drafts_broker_user_id_idx" ON "legal_form_drafts"("broker_user_id");

ALTER TABLE "legal_form_drafts" ADD CONSTRAINT "legal_form_drafts_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "legal_form_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "legal_form_drafts" ADD CONSTRAINT "legal_form_drafts_broker_user_id_fkey" FOREIGN KEY ("broker_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "legal_form_drafts" ADD CONSTRAINT "legal_form_drafts_client_user_id_fkey" FOREIGN KEY ("client_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "legal_form_suggestions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "draft_id" UUID NOT NULL,
    "field_key" TEXT,
    "suggestion_type" TEXT NOT NULL,
    "suggested_value" TEXT,
    "source_type" TEXT,
    "source_ref" TEXT,
    "confidence" INTEGER,
    "explanation" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "legal_form_suggestions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "legal_form_suggestions_draft_id_idx" ON "legal_form_suggestions"("draft_id");
CREATE INDEX "legal_form_suggestions_field_key_idx" ON "legal_form_suggestions"("field_key");

ALTER TABLE "legal_form_suggestions" ADD CONSTRAINT "legal_form_suggestions_draft_id_fkey" FOREIGN KEY ("draft_id") REFERENCES "legal_form_drafts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "legal_form_alerts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "draft_id" UUID NOT NULL,
    "severity" TEXT NOT NULL,
    "alert_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "source_type" TEXT,
    "source_ref" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "legal_form_alerts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "legal_form_alerts_draft_id_idx" ON "legal_form_alerts"("draft_id");
CREATE INDEX "legal_form_alerts_severity_idx" ON "legal_form_alerts"("severity");

ALTER TABLE "legal_form_alerts" ADD CONSTRAINT "legal_form_alerts_draft_id_fkey" FOREIGN KEY ("draft_id") REFERENCES "legal_form_drafts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "legal_form_audit_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "draft_id" UUID NOT NULL,
    "actor_user_id" TEXT,
    "event_type" TEXT NOT NULL,
    "metadata_json" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "legal_form_audit_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "legal_form_audit_events_draft_id_idx" ON "legal_form_audit_events"("draft_id");

ALTER TABLE "legal_form_audit_events" ADD CONSTRAINT "legal_form_audit_events_draft_id_fkey" FOREIGN KEY ("draft_id") REFERENCES "legal_form_drafts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
