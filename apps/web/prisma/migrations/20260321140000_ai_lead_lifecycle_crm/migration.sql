-- Lead lifecycle: source, tier, CRM interactions, retention, deal crm_stage
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "lead_source" TEXT;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "ai_tier" TEXT;
CREATE INDEX IF NOT EXISTS "Lead_lead_source_idx" ON "Lead"("lead_source");
CREATE INDEX IF NOT EXISTS "Lead_ai_tier_idx" ON "Lead"("ai_tier");

ALTER TABLE "deals" ADD COLUMN IF NOT EXISTS "crm_stage" TEXT;
CREATE INDEX IF NOT EXISTS "deals_crm_stage_idx" ON "deals"("crm_stage");

CREATE TABLE IF NOT EXISTS "crm_interactions" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT,
    "deal_id" TEXT,
    "broker_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "crm_interactions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "crm_interactions_lead_id_idx" ON "crm_interactions"("lead_id");
CREATE INDEX IF NOT EXISTS "crm_interactions_deal_id_idx" ON "crm_interactions"("deal_id");
CREATE INDEX IF NOT EXISTS "crm_interactions_broker_id_created_at_idx" ON "crm_interactions"("broker_id", "created_at");

DO $$ BEGIN
 ALTER TABLE "crm_interactions" ADD CONSTRAINT "crm_interactions_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
 ALTER TABLE "crm_interactions" ADD CONSTRAINT "crm_interactions_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
 ALTER TABLE "crm_interactions" ADD CONSTRAINT "crm_interactions_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "client_retention_touchpoints" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "broker_id" TEXT NOT NULL,
    "scheduled_for" TIMESTAMP(3) NOT NULL,
    "template_key" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "client_retention_touchpoints_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "client_retention_touchpoints_broker_id_scheduled_for_status_idx" ON "client_retention_touchpoints"("broker_id", "scheduled_for", "status");
CREATE INDEX IF NOT EXISTS "client_retention_touchpoints_lead_id_idx" ON "client_retention_touchpoints"("lead_id");

DO $$ BEGIN
 ALTER TABLE "client_retention_touchpoints" ADD CONSTRAINT "client_retention_touchpoints_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
 ALTER TABLE "client_retention_touchpoints" ADD CONSTRAINT "client_retention_touchpoints_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
