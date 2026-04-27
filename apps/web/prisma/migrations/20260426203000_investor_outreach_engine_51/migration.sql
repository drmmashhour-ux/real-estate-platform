-- Order 51.1: investor pipeline + outreach log (no email transport in app layer)
CREATE TABLE "investor_leads" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "investor_leads_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "investor_outreach" (
    "id" TEXT NOT NULL,
    "investor_id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "investor_outreach_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "investor_outreach_investor_id_idx" ON "investor_outreach"("investor_id");

ALTER TABLE "investor_outreach" ADD CONSTRAINT "investor_outreach_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "investor_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
