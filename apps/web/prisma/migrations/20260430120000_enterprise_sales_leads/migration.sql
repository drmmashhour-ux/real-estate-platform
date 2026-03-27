-- Enterprise B2B sales CRM (see docs/enterprise-sales.md)
CREATE TYPE "EnterpriseLeadSegment" AS ENUM ('PROPERTY_MANAGEMENT', 'REAL_ESTATE_AGENCY', 'MULTI_PROPERTY_HOST', 'STR_OPERATOR', 'TRAVEL_BUSINESS');
CREATE TYPE "EnterpriseLeadStage" AS ENUM ('LEAD_IDENTIFIED', 'CONTACTED', 'INTERESTED', 'DEMO_SCHEDULED', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST');

CREATE TABLE "enterprise_leads" (
    "id" TEXT NOT NULL,
    "company_name" VARCHAR(320) NOT NULL,
    "contact_name" VARCHAR(160),
    "email" VARCHAR(320) NOT NULL,
    "phone" VARCHAR(64),
    "segment" "EnterpriseLeadSegment" NOT NULL,
    "stage" "EnterpriseLeadStage" NOT NULL DEFAULT 'LEAD_IDENTIFIED',
    "notes" TEXT,
    "deal_value_estimate_cents" INTEGER,
    "follow_up_at" TIMESTAMP(3),
    "lead_score" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enterprise_leads_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "enterprise_leads_stage_idx" ON "enterprise_leads"("stage");
CREATE INDEX "enterprise_leads_segment_idx" ON "enterprise_leads"("segment");
CREATE INDEX "enterprise_leads_follow_up_at_idx" ON "enterprise_leads"("follow_up_at");
CREATE INDEX "enterprise_leads_created_at_idx" ON "enterprise_leads"("created_at");
