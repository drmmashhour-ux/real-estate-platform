-- LECIPM fundraising CRM: investors, interactions, deals

CREATE TABLE "fundraising_investors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firm" TEXT NOT NULL DEFAULT '',
    "stage" TEXT NOT NULL DEFAULT 'contacted',
    "notes" TEXT,
    "next_follow_up_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fundraising_investors_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "fundraising_investors_stage_idx" ON "fundraising_investors"("stage");
CREATE INDEX "fundraising_investors_email_idx" ON "fundraising_investors"("email");

CREATE TABLE "fundraising_investor_interactions" (
    "id" TEXT NOT NULL,
    "investor_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fundraising_investor_interactions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "fundraising_investor_interactions_investor_id_created_at_idx" ON "fundraising_investor_interactions"("investor_id", "created_at");

CREATE TABLE "fundraising_deals" (
    "id" TEXT NOT NULL,
    "investor_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fundraising_deals_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "fundraising_deals_investor_id_idx" ON "fundraising_deals"("investor_id");
CREATE INDEX "fundraising_deals_status_idx" ON "fundraising_deals"("status");

ALTER TABLE "fundraising_investor_interactions" ADD CONSTRAINT "fundraising_investor_interactions_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "fundraising_investors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "fundraising_deals" ADD CONSTRAINT "fundraising_deals_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "fundraising_investors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
