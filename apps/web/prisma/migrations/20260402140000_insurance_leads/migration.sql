-- Insurance partners + leads + revenue log (MVP)

CREATE TYPE "InsuranceLeadType" AS ENUM ('TRAVEL', 'PROPERTY', 'MORTGAGE');
CREATE TYPE "InsuranceLeadSource" AS ENUM ('BNBHUB', 'LISTING', 'CHECKOUT', 'MANUAL');
CREATE TYPE "InsuranceLeadStatus" AS ENUM ('NEW', 'SENT', 'CONVERTED', 'REJECTED');

CREATE TABLE "insurance_partners" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact_email" TEXT NOT NULL,
    "webhook_url" TEXT,
    "fixed_price_per_lead" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insurance_partners_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "insurance_leads" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "full_name" TEXT,
    "lead_type" "InsuranceLeadType" NOT NULL,
    "listing_id" TEXT,
    "booking_id" TEXT,
    "source" "InsuranceLeadSource" NOT NULL,
    "message" TEXT,
    "consent_given" BOOLEAN NOT NULL,
    "consent_text" TEXT NOT NULL,
    "status" "InsuranceLeadStatus" NOT NULL DEFAULT 'NEW',
    "partner_id" TEXT,
    "estimated_value" DECIMAL(18,2),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insurance_leads_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "insurance_revenue_logs" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "partner_id" TEXT,
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'CAD',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "insurance_revenue_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "insurance_partners_is_active_idx" ON "insurance_partners"("is_active");

ALTER TABLE "insurance_leads" ADD CONSTRAINT "insurance_leads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "insurance_leads" ADD CONSTRAINT "insurance_leads_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "insurance_leads" ADD CONSTRAINT "insurance_leads_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "insurance_partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "insurance_revenue_logs" ADD CONSTRAINT "insurance_revenue_logs_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "insurance_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "insurance_revenue_logs" ADD CONSTRAINT "insurance_revenue_logs_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "insurance_partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "insurance_leads_status_idx" ON "insurance_leads"("status");
CREATE INDEX "insurance_leads_lead_type_idx" ON "insurance_leads"("lead_type");
CREATE INDEX "insurance_leads_created_at_idx" ON "insurance_leads"("created_at");
CREATE INDEX "insurance_leads_user_id_idx" ON "insurance_leads"("user_id");
CREATE INDEX "insurance_leads_partner_id_idx" ON "insurance_leads"("partner_id");
CREATE INDEX "insurance_revenue_logs_lead_id_idx" ON "insurance_revenue_logs"("lead_id");
