-- Growth CRM (permission-based pipeline) + optional fields on public LP captures.

CREATE TYPE "GrowthEngineLeadRole" AS ENUM ('owner', 'broker', 'buyer', 'host');

CREATE TYPE "GrowthEngineLeadSource" AS ENUM ('form', 'csv', 'manual', 'referral');

CREATE TYPE "GrowthEnginePermissionStatus" AS ENUM ('unknown', 'requested', 'granted', 'rejected', 'granted_by_source');

CREATE TYPE "GrowthEngineLeadStage" AS ENUM ('new', 'contacted', 'interested', 'awaiting_assets', 'converted', 'lost');

CREATE TABLE "growth_engine_leads" (
    "id" TEXT NOT NULL,
    "role" "GrowthEngineLeadRole" NOT NULL,
    "name" VARCHAR(200),
    "email" VARCHAR(320),
    "phone" VARCHAR(64),
    "city" VARCHAR(120),
    "category" VARCHAR(120),
    "intent" VARCHAR(64),
    "source" "GrowthEngineLeadSource" NOT NULL,
    "permissionStatus" "GrowthEnginePermissionStatus" NOT NULL DEFAULT 'unknown',
    "stage" "GrowthEngineLeadStage" NOT NULL DEFAULT 'new',
    "assigned_to_user_id" TEXT,
    "last_contact_at" TIMESTAMP(3),
    "last_template_key" VARCHAR(64),
    "notes" TEXT,
    "referral_code" VARCHAR(64),
    "referred_by_user_id" TEXT,
    "consent_at" TIMESTAMP(3),
    "needs_follow_up" BOOLEAN NOT NULL DEFAULT false,
    "follow_up_reason" VARCHAR(256),
    "archived_at" TIMESTAMP(3),
    "listing_acquisition_lead_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "growth_engine_leads_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "growth_engine_leads_listing_acquisition_lead_id_key" ON "growth_engine_leads"("listing_acquisition_lead_id");

CREATE INDEX "growth_engine_leads_email_idx" ON "growth_engine_leads"("email");

CREATE INDEX "growth_engine_leads_stage_idx" ON "growth_engine_leads"("stage");

CREATE INDEX "growth_engine_leads_source_idx" ON "growth_engine_leads"("source");

CREATE INDEX "growth_engine_leads_role_idx" ON "growth_engine_leads"("role");

CREATE INDEX "growth_engine_leads_needs_follow_up_idx" ON "growth_engine_leads"("needs_follow_up");

CREATE INDEX "growth_engine_leads_created_at_idx" ON "growth_engine_leads"("created_at");

ALTER TABLE "growth_engine_leads" ADD CONSTRAINT "growth_engine_leads_assigned_to_user_id_fkey" FOREIGN KEY ("assigned_to_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "growth_engine_leads" ADD CONSTRAINT "growth_engine_leads_referred_by_user_id_fkey" FOREIGN KEY ("referred_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "growth_engine_leads" ADD CONSTRAINT "growth_engine_leads_listing_acquisition_lead_id_fkey" FOREIGN KEY ("listing_acquisition_lead_id") REFERENCES "listing_acquisition_leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "growth_lead_captures" ADD COLUMN IF NOT EXISTS "full_name" VARCHAR(200),
ADD COLUMN IF NOT EXISTS "city" VARCHAR(120),
ADD COLUMN IF NOT EXISTS "category" VARCHAR(120),
ADD COLUMN IF NOT EXISTS "intent_detail" VARCHAR(32),
ADD COLUMN IF NOT EXISTS "consent_at" TIMESTAMP(3);
