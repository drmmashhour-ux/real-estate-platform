-- Founder outreach CRM (Montreal host acquisition pipeline — manual, Law 25 compliant)

CREATE TABLE "outreach_leads" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "contact" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "market" TEXT,
    "created_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outreach_leads_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "outreach_leads_status_idx" ON "outreach_leads"("status");
CREATE INDEX "outreach_leads_source_idx" ON "outreach_leads"("source");
CREATE INDEX "outreach_leads_created_at_idx" ON "outreach_leads"("created_at");

ALTER TABLE "outreach_leads" ADD CONSTRAINT "outreach_leads_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
