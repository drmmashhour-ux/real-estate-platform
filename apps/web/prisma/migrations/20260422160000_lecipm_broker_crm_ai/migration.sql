-- LECIPM AI-assisted broker CRM (inquiry leads; distinct from billing broker_leads)

CREATE TYPE "LecipmBrokerCrmLeadStatus" AS ENUM (
  'new',
  'contacted',
  'qualified',
  'visit_scheduled',
  'negotiating',
  'closed',
  'lost'
);

CREATE TYPE "LecipmBrokerCrmPriorityLabel" AS ENUM ('low', 'medium', 'high');

CREATE TYPE "LecipmBrokerCrmLeadSource" AS ENUM (
  'listing_contact',
  'broker_profile',
  'general_inquiry',
  'booking_inquiry',
  'manual'
);

CREATE TABLE "lecipm_broker_crm_leads" (
    "id" TEXT NOT NULL,
    "thread_id" TEXT,
    "listing_id" TEXT,
    "broker_user_id" TEXT NOT NULL,
    "customer_user_id" TEXT,
    "guest_name" TEXT,
    "guest_email" TEXT,
    "status" "LecipmBrokerCrmLeadStatus" NOT NULL DEFAULT 'new',
    "priority_score" INTEGER NOT NULL DEFAULT 0,
    "priority_label" "LecipmBrokerCrmPriorityLabel" NOT NULL DEFAULT 'low',
    "source" "LecipmBrokerCrmLeadSource" NOT NULL,
    "interest_summary" TEXT,
    "next_follow_up_at" TIMESTAMP(3),
    "last_contact_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lecipm_broker_crm_leads_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "lecipm_broker_crm_leads_thread_id_key" ON "lecipm_broker_crm_leads"("thread_id");

CREATE INDEX "lecipm_broker_crm_leads_broker_user_id_idx" ON "lecipm_broker_crm_leads"("broker_user_id");
CREATE INDEX "lecipm_broker_crm_leads_thread_id_idx" ON "lecipm_broker_crm_leads"("thread_id");
CREATE INDEX "lecipm_broker_crm_leads_listing_id_idx" ON "lecipm_broker_crm_leads"("listing_id");
CREATE INDEX "lecipm_broker_crm_leads_status_idx" ON "lecipm_broker_crm_leads"("status");
CREATE INDEX "lecipm_broker_crm_leads_priority_label_idx" ON "lecipm_broker_crm_leads"("priority_label");
CREATE INDEX "lecipm_broker_crm_leads_next_follow_up_at_idx" ON "lecipm_broker_crm_leads"("next_follow_up_at");

ALTER TABLE "lecipm_broker_crm_leads" ADD CONSTRAINT "lecipm_broker_crm_leads_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "lecipm_broker_listing_threads"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "lecipm_broker_crm_leads" ADD CONSTRAINT "lecipm_broker_crm_leads_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "lecipm_broker_crm_leads" ADD CONSTRAINT "lecipm_broker_crm_leads_broker_user_id_fkey" FOREIGN KEY ("broker_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lecipm_broker_crm_leads" ADD CONSTRAINT "lecipm_broker_crm_leads_customer_user_id_fkey" FOREIGN KEY ("customer_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "lecipm_broker_crm_lead_notes" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "broker_user_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lecipm_broker_crm_lead_notes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lecipm_broker_crm_lead_notes_lead_id_idx" ON "lecipm_broker_crm_lead_notes"("lead_id");

ALTER TABLE "lecipm_broker_crm_lead_notes" ADD CONSTRAINT "lecipm_broker_crm_lead_notes_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "lecipm_broker_crm_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lecipm_broker_crm_lead_notes" ADD CONSTRAINT "lecipm_broker_crm_lead_notes_broker_user_id_fkey" FOREIGN KEY ("broker_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "lecipm_broker_crm_lead_tags" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "tag" VARCHAR(64) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lecipm_broker_crm_lead_tags_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lecipm_broker_crm_lead_tags_lead_id_idx" ON "lecipm_broker_crm_lead_tags"("lead_id");
CREATE INDEX "lecipm_broker_crm_lead_tags_tag_idx" ON "lecipm_broker_crm_lead_tags"("tag");
CREATE UNIQUE INDEX "lecipm_broker_crm_lead_tags_lead_id_tag_key" ON "lecipm_broker_crm_lead_tags"("lead_id", "tag");

ALTER TABLE "lecipm_broker_crm_lead_tags" ADD CONSTRAINT "lecipm_broker_crm_lead_tags_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "lecipm_broker_crm_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "lecipm_broker_crm_ai_insights" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "thread_id" TEXT,
    "summary" TEXT,
    "suggested_reply" TEXT,
    "next_best_action" TEXT,
    "intent_score" INTEGER,
    "urgency_score" INTEGER,
    "confidence_score" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lecipm_broker_crm_ai_insights_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lecipm_broker_crm_ai_insights_lead_id_idx" ON "lecipm_broker_crm_ai_insights"("lead_id");

ALTER TABLE "lecipm_broker_crm_ai_insights" ADD CONSTRAINT "lecipm_broker_crm_ai_insights_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "lecipm_broker_crm_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
