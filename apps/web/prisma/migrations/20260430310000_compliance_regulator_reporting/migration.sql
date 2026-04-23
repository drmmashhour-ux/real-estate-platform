-- Regulator reporting runs, items, definitions, export profiles, scheduled report hooks.

CREATE TABLE "compliance_report_definitions" (
    "id" TEXT NOT NULL,
    "report_key" TEXT NOT NULL,
    "owner_type" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "report_type" TEXT NOT NULL,
    "allowed_scopes" JSONB NOT NULL,
    "default_format" TEXT NOT NULL DEFAULT 'json',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compliance_report_definitions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "compliance_report_definitions_report_key_key" ON "compliance_report_definitions"("report_key");
CREATE INDEX "idx_report_def_owner" ON "compliance_report_definitions"("owner_type", "owner_id");

CREATE TABLE "compliance_report_runs" (
    "id" TEXT NOT NULL,
    "run_number" TEXT NOT NULL,
    "owner_type" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "report_definition_id" TEXT,
    "report_key" TEXT NOT NULL,
    "report_type" TEXT NOT NULL,
    "scope_type" TEXT NOT NULL,
    "scope_id" TEXT,
    "date_from" TIMESTAMP(3),
    "date_to" TIMESTAMP(3),
    "requested_by_actor_id" TEXT,
    "generated_by_system" BOOLEAN NOT NULL DEFAULT false,
    "format" TEXT NOT NULL DEFAULT 'json',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "manifest" JSONB,
    "summary" JSONB,
    "file_url" TEXT,
    "generated_at" TIMESTAMP(3),
    "sealed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compliance_report_runs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "compliance_report_runs_run_number_key" ON "compliance_report_runs"("run_number");
CREATE INDEX "idx_report_run_owner" ON "compliance_report_runs"("owner_type", "owner_id");
CREATE INDEX "idx_report_run_status" ON "compliance_report_runs"("status");

ALTER TABLE "compliance_report_runs" ADD CONSTRAINT "compliance_report_runs_report_definition_id_fkey" FOREIGN KEY ("report_definition_id") REFERENCES "compliance_report_definitions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "compliance_report_items" (
    "id" TEXT NOT NULL,
    "compliance_report_run_id" TEXT NOT NULL,
    "source_type" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "category" VARCHAR(128),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compliance_report_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_report_item_run" ON "compliance_report_items"("compliance_report_run_id");

ALTER TABLE "compliance_report_items" ADD CONSTRAINT "compliance_report_items_compliance_report_run_id_fkey" FOREIGN KEY ("compliance_report_run_id") REFERENCES "compliance_report_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "regulator_export_profiles" (
    "id" TEXT NOT NULL,
    "owner_type" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "regulator_key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "included_modules" JSONB NOT NULL,
    "default_report_keys" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "regulator_export_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uniq_regulator_profile" ON "regulator_export_profiles"("owner_type", "owner_id", "regulator_key");

CREATE TABLE "compliance_scheduled_reports" (
    "id" TEXT NOT NULL,
    "owner_type" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "report_key" TEXT NOT NULL,
    "report_type" TEXT NOT NULL,
    "scope_type" TEXT NOT NULL,
    "scope_id" TEXT,
    "frequency" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "last_run_at" TIMESTAMP(3),
    "next_run_at" TIMESTAMP(3),
    "created_by_actor_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compliance_scheduled_reports_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_scheduled_report_owner" ON "compliance_scheduled_reports"("owner_type", "owner_id", "active");

-- Seed OACIQ + internal oversight profiles (idempotent).
INSERT INTO "regulator_export_profiles" ("id", "owner_type", "owner_id", "regulator_key", "title", "included_modules", "default_report_keys", "active", "created_at", "updated_at")
VALUES
(
  gen_random_uuid()::text,
  'platform',
  'platform',
  'oaciq',
  'OACIQ Inspection Export',
  '["declarations","contracts","trust","financial","complaints","audit","risk"]'::jsonb,
  '["inspection_packet","complaint_register","trust_review","financial_register"]'::jsonb,
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),
(
  gen_random_uuid()::text,
  'platform',
  'platform',
  'internal_oversight',
  'Internal Compliance Oversight Pack',
  '["audit","risk","complaints","financial"]'::jsonb,
  '["agency_summary","broker_summary","full_compliance_dossier"]'::jsonb,
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("owner_type", "owner_id", "regulator_key") DO NOTHING;
