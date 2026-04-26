-- Order 39.1 — campaign optimizer: performance snapshots + completed_at on growth campaigns.
ALTER TABLE "bnhub_growth_campaigns" ADD COLUMN "completed_at" TIMESTAMP(3);

CREATE TABLE "campaign_performances" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "spend_cents" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "campaign_performances_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "campaign_performances_campaign_id_created_at_idx" ON "campaign_performances"("campaign_id", "created_at");

ALTER TABLE "campaign_performances" ADD CONSTRAINT "campaign_performances_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "bnhub_growth_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
