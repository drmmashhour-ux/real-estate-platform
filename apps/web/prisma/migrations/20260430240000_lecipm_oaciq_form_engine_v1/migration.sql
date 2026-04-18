-- LECIPM OACIQ form engine v1 — uploaded PDF templates + deal form instances (broker-controlled; audit trail).

CREATE TYPE "OaciqFormFamily" AS ENUM (
  'PPG',
  'CP',
  'DS',
  'IV',
  'ANNEX_G',
  'ANNEX_R',
  'ANNEX_RC',
  'ANNEX_L',
  'SYNDICATE_REQUEST',
  'MORTGAGE_REQUEST',
  'DISCLOSURE_NOTICE',
  'LISTING_CONTRACT',
  'BUYER_CONTRACT',
  'LEASE_CONTRACT',
  'OTHER'
);

CREATE TYPE "OaciqPdfFieldKind" AS ENUM (
  'text',
  'checkbox',
  'date',
  'signature',
  'dropdown',
  'radio',
  'unknown'
);

CREATE TYPE "LecipmFormInstanceStatus" AS ENUM (
  'draft',
  'ai_generated',
  'broker_review',
  'client_review',
  'signed',
  'archived'
);

CREATE TABLE "oaciq_form_templates" (
    "id" TEXT NOT NULL,
    "form_family" "OaciqFormFamily" NOT NULL,
    "version_label" VARCHAR(64),
    "source_pdf_key" VARCHAR(512),
    "schema" JSONB NOT NULL DEFAULT '{}',
    "extracted_field_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "oaciq_form_templates_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "oaciq_form_templates_form_family_idx" ON "oaciq_form_templates"("form_family");

CREATE TABLE "oaciq_form_fields" (
    "id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "field_key" VARCHAR(200) NOT NULL,
    "label" TEXT NOT NULL,
    "field_type" "OaciqPdfFieldKind" NOT NULL,
    "section" VARCHAR(200),
    "page" INTEGER,
    "required" BOOLEAN,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "oaciq_form_fields_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "oaciq_form_fields_template_id_idx" ON "oaciq_form_fields"("template_id");
CREATE INDEX "oaciq_form_fields_field_key_idx" ON "oaciq_form_fields"("field_key");

ALTER TABLE "oaciq_form_fields" ADD CONSTRAINT "oaciq_form_fields_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "oaciq_form_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "lecipm_form_instances" (
    "id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "status" "LecipmFormInstanceStatus" NOT NULL DEFAULT 'draft',
    "data" JSONB NOT NULL DEFAULT '{}',
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lecipm_form_instances_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lecipm_form_instances_deal_id_idx" ON "lecipm_form_instances"("deal_id");
CREATE INDEX "lecipm_form_instances_template_id_idx" ON "lecipm_form_instances"("template_id");
CREATE INDEX "lecipm_form_instances_status_idx" ON "lecipm_form_instances"("status");

ALTER TABLE "lecipm_form_instances" ADD CONSTRAINT "lecipm_form_instances_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "oaciq_form_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "lecipm_form_instances" ADD CONSTRAINT "lecipm_form_instances_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lecipm_form_instances" ADD CONSTRAINT "lecipm_form_instances_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "lecipm_form_versions" (
    "id" TEXT NOT NULL,
    "form_instance_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lecipm_form_versions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lecipm_form_versions_form_instance_id_idx" ON "lecipm_form_versions"("form_instance_id");

ALTER TABLE "lecipm_form_versions" ADD CONSTRAINT "lecipm_form_versions_form_instance_id_fkey" FOREIGN KEY ("form_instance_id") REFERENCES "lecipm_form_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;
