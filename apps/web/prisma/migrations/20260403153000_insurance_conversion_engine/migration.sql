-- Insurance funnel analytics, lead scoring, partner pricing tiers

CREATE TYPE "InsuranceLeadFunnelEventType" AS ENUM ('LEAD_FORM_VIEWED', 'LEAD_STARTED', 'LEAD_SUBMITTED', 'LEAD_FAILED');

CREATE TABLE "insurance_lead_funnel_events" (
    "id" TEXT NOT NULL,
    "event_type" "InsuranceLeadFunnelEventType" NOT NULL,
    "funnel_source" TEXT NOT NULL,
    "lead_type" "InsuranceLeadType",
    "device" TEXT NOT NULL,
    "lead_id" TEXT,
    "variant_id" TEXT,
    "metadata" JSONB,
    "ip_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "insurance_lead_funnel_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "insurance_lead_funnel_events_event_type_created_at_idx" ON "insurance_lead_funnel_events"("event_type", "created_at");
CREATE INDEX "insurance_lead_funnel_events_funnel_source_created_at_idx" ON "insurance_lead_funnel_events"("funnel_source", "created_at");

ALTER TABLE "insurance_partners" ADD COLUMN "base_price_per_lead" DECIMAL(18,2),
ADD COLUMN "bonus_high_quality_lead" DECIMAL(18,2) NOT NULL DEFAULT 0,
ADD COLUMN "preferred_lead_types" JSONB;

UPDATE "insurance_partners" SET "base_price_per_lead" = "fixed_price_per_lead" WHERE "base_price_per_lead" IS NULL;

ALTER TABLE "insurance_leads" ADD COLUMN "lead_score" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "variant_id" TEXT;

CREATE INDEX "insurance_leads_email_created_at_idx" ON "insurance_leads"("email", "created_at");
