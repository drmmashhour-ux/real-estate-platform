-- LECIPM broker CRM pipeline + communication copilot (distinct from billing `BrokerLead` / legacy `BrokerClient`).

CREATE TYPE "LecipmCrmContactType" AS ENUM ('lead', 'buyer', 'seller', 'lessor', 'lessee', 'investor', 'co_broker', 'unrepresented_party');

CREATE TYPE "LecipmCrmPipelineLeadStatus" AS ENUM ('new', 'engaged', 'warm', 'hot', 'inactive', 'converted', 'lost');

CREATE TYPE "LecipmBrokerTaskStatus" AS ENUM ('open', 'done', 'cancelled');

CREATE TYPE "LecipmBrokerTaskPriority" AS ENUM ('low', 'medium', 'high', 'urgent');

CREATE TYPE "LecipmCommDraftStatus" AS ENUM ('draft', 'pending_approval', 'approved', 'rejected', 'sent', 'superseded');

CREATE TYPE "LecipmCommChannel" AS ENUM ('email', 'sms', 'in_app', 'call_prep');

CREATE TYPE "LecipmCommLogDirection" AS ENUM ('outbound', 'inbound', 'internal_note');

CREATE TABLE "lecipm_crm_contacts" (
    "id" TEXT NOT NULL,
    "broker_id" TEXT NOT NULL,
    "contact_type" "LecipmCrmContactType" NOT NULL,
    "stage" VARCHAR(32) NOT NULL DEFAULT 'new',
    "full_name" VARCHAR(160) NOT NULL,
    "email" VARCHAR(160),
    "phone" VARCHAR(32),
    "preferred_language" VARCHAR(8),
    "source" VARCHAR(64),
    "notes" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lecipm_crm_contacts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "lecipm_crm_pipeline_leads" (
    "id" TEXT NOT NULL,
    "broker_id" TEXT NOT NULL,
    "contact_id" TEXT NOT NULL,
    "lead_type" VARCHAR(48) NOT NULL,
    "source" VARCHAR(64),
    "intent_level" VARCHAR(24),
    "status" "LecipmCrmPipelineLeadStatus" NOT NULL DEFAULT 'new',
    "platform_lead_id" TEXT,
    "related_listing_id" TEXT,
    "related_deal_id" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lecipm_crm_pipeline_leads_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "lecipm_broker_client_profiles" (
    "id" TEXT NOT NULL,
    "broker_id" TEXT NOT NULL,
    "contact_id" TEXT NOT NULL,
    "client_role" VARCHAR(32) NOT NULL,
    "preferences" JSONB NOT NULL DEFAULT '{}',
    "risk_flags" JSONB NOT NULL DEFAULT '[]',
    "communication_prefs" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lecipm_broker_client_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "lecipm_broker_tasks" (
    "id" TEXT NOT NULL,
    "broker_id" TEXT NOT NULL,
    "contact_id" TEXT,
    "deal_id" TEXT,
    "task_type" VARCHAR(64) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "due_at" TIMESTAMP(3),
    "status" "LecipmBrokerTaskStatus" NOT NULL DEFAULT 'open',
    "priority" "LecipmBrokerTaskPriority" NOT NULL DEFAULT 'medium',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lecipm_broker_tasks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "lecipm_communication_drafts" (
    "id" TEXT NOT NULL,
    "broker_id" TEXT NOT NULL,
    "contact_id" TEXT,
    "deal_id" TEXT,
    "draft_type" VARCHAR(64) NOT NULL,
    "channel" "LecipmCommChannel" NOT NULL,
    "subject" VARCHAR(300),
    "body" TEXT NOT NULL,
    "status" "LecipmCommDraftStatus" NOT NULL DEFAULT 'draft',
    "requires_approval" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lecipm_communication_drafts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "lecipm_communication_logs" (
    "id" TEXT NOT NULL,
    "broker_id" TEXT NOT NULL,
    "contact_id" TEXT,
    "deal_id" TEXT,
    "channel" "LecipmCommChannel" NOT NULL,
    "direction" "LecipmCommLogDirection" NOT NULL,
    "subject" VARCHAR(300),
    "body_snapshot" TEXT,
    "sent_at" TIMESTAMP(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lecipm_communication_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "lecipm_broker_crm_audit_logs" (
    "id" TEXT NOT NULL,
    "broker_id" TEXT NOT NULL,
    "deal_id" TEXT,
    "contact_id" TEXT,
    "action_key" VARCHAR(96) NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lecipm_broker_crm_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lecipm_crm_contacts_broker_id_idx" ON "lecipm_crm_contacts"("broker_id");

CREATE INDEX "lecipm_crm_contacts_broker_id_stage_idx" ON "lecipm_crm_contacts"("broker_id", "stage");

CREATE INDEX "lecipm_crm_contacts_email_idx" ON "lecipm_crm_contacts"("email");

CREATE INDEX "lecipm_crm_pipeline_leads_broker_id_idx" ON "lecipm_crm_pipeline_leads"("broker_id");

CREATE INDEX "lecipm_crm_pipeline_leads_contact_id_idx" ON "lecipm_crm_pipeline_leads"("contact_id");

CREATE INDEX "lecipm_crm_pipeline_leads_platform_lead_id_idx" ON "lecipm_crm_pipeline_leads"("platform_lead_id");

CREATE INDEX "lecipm_crm_pipeline_leads_related_deal_id_idx" ON "lecipm_crm_pipeline_leads"("related_deal_id");

CREATE INDEX "lecipm_broker_client_profiles_contact_id_idx" ON "lecipm_broker_client_profiles"("contact_id");

CREATE UNIQUE INDEX "lecipm_broker_client_profiles_broker_id_contact_id_key" ON "lecipm_broker_client_profiles"("broker_id", "contact_id");

CREATE INDEX "lecipm_broker_tasks_broker_id_idx" ON "lecipm_broker_tasks"("broker_id");

CREATE INDEX "lecipm_broker_tasks_contact_id_idx" ON "lecipm_broker_tasks"("contact_id");

CREATE INDEX "lecipm_broker_tasks_deal_id_idx" ON "lecipm_broker_tasks"("deal_id");

CREATE INDEX "lecipm_broker_tasks_due_at_idx" ON "lecipm_broker_tasks"("due_at");

CREATE INDEX "lecipm_communication_drafts_broker_id_idx" ON "lecipm_communication_drafts"("broker_id");

CREATE INDEX "lecipm_communication_drafts_contact_id_idx" ON "lecipm_communication_drafts"("contact_id");

CREATE INDEX "lecipm_communication_drafts_deal_id_idx" ON "lecipm_communication_drafts"("deal_id");

CREATE INDEX "lecipm_communication_drafts_status_idx" ON "lecipm_communication_drafts"("status");

CREATE INDEX "lecipm_communication_logs_broker_id_idx" ON "lecipm_communication_logs"("broker_id");

CREATE INDEX "lecipm_communication_logs_contact_id_idx" ON "lecipm_communication_logs"("contact_id");

CREATE INDEX "lecipm_communication_logs_deal_id_idx" ON "lecipm_communication_logs"("deal_id");

CREATE INDEX "lecipm_communication_logs_created_at_idx" ON "lecipm_communication_logs"("created_at");

CREATE INDEX "lecipm_broker_crm_audit_logs_broker_id_created_at_idx" ON "lecipm_broker_crm_audit_logs"("broker_id", "created_at");

CREATE INDEX "lecipm_broker_crm_audit_logs_deal_id_idx" ON "lecipm_broker_crm_audit_logs"("deal_id");

ALTER TABLE "lecipm_crm_contacts" ADD CONSTRAINT "lecipm_crm_contacts_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lecipm_crm_pipeline_leads" ADD CONSTRAINT "lecipm_crm_pipeline_leads_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lecipm_crm_pipeline_leads" ADD CONSTRAINT "lecipm_crm_pipeline_leads_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "lecipm_crm_contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lecipm_crm_pipeline_leads" ADD CONSTRAINT "lecipm_crm_pipeline_leads_platform_lead_id_fkey" FOREIGN KEY ("platform_lead_id") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "lecipm_crm_pipeline_leads" ADD CONSTRAINT "lecipm_crm_pipeline_leads_related_deal_id_fkey" FOREIGN KEY ("related_deal_id") REFERENCES "deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "lecipm_broker_client_profiles" ADD CONSTRAINT "lecipm_broker_client_profiles_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lecipm_broker_client_profiles" ADD CONSTRAINT "lecipm_broker_client_profiles_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "lecipm_crm_contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lecipm_broker_tasks" ADD CONSTRAINT "lecipm_broker_tasks_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lecipm_broker_tasks" ADD CONSTRAINT "lecipm_broker_tasks_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "lecipm_crm_contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "lecipm_broker_tasks" ADD CONSTRAINT "lecipm_broker_tasks_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "lecipm_communication_drafts" ADD CONSTRAINT "lecipm_communication_drafts_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lecipm_communication_drafts" ADD CONSTRAINT "lecipm_communication_drafts_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "lecipm_crm_contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "lecipm_communication_drafts" ADD CONSTRAINT "lecipm_communication_drafts_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "lecipm_communication_logs" ADD CONSTRAINT "lecipm_communication_logs_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lecipm_communication_logs" ADD CONSTRAINT "lecipm_communication_logs_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "lecipm_crm_contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "lecipm_communication_logs" ADD CONSTRAINT "lecipm_communication_logs_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "lecipm_broker_crm_audit_logs" ADD CONSTRAINT "lecipm_broker_crm_audit_logs_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lecipm_broker_crm_audit_logs" ADD CONSTRAINT "lecipm_broker_crm_audit_logs_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
