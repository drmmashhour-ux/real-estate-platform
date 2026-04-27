-- Order 38.1: status enum, created_by audit, one performance row per campaign

-- Enum for campaign lifecycle
CREATE TYPE "BrokerAdSimulationCampaignStatus" AS ENUM (
  'draft',
  'scheduled',
  'running',
  'completed'
);

-- Replace varchar status with native enum; coerce unknown values to draft
ALTER TABLE "broker_ad_simulation_campaigns" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "broker_ad_simulation_campaigns" ALTER COLUMN "status" TYPE "BrokerAdSimulationCampaignStatus" USING (
  CASE
    WHEN "status" = 'draft' THEN 'draft'::"BrokerAdSimulationCampaignStatus"
    WHEN "status" = 'scheduled' THEN 'scheduled'::"BrokerAdSimulationCampaignStatus"
    WHEN "status" = 'running' THEN 'running'::"BrokerAdSimulationCampaignStatus"
    WHEN "status" = 'completed' THEN 'completed'::"BrokerAdSimulationCampaignStatus"
    ELSE 'draft'::"BrokerAdSimulationCampaignStatus"
  END
);
ALTER TABLE "broker_ad_simulation_campaigns" ALTER COLUMN "status" SET DEFAULT 'draft'::"BrokerAdSimulationCampaignStatus";

-- Audit: who created the row
ALTER TABLE "broker_ad_simulation_campaigns" ADD COLUMN IF NOT EXISTS "created_by" VARCHAR(16);

-- Keep a single performance snapshot per campaign (delete older duplicates, keep latest)
DELETE FROM "broker_ad_simulation_performances" AS p
WHERE p."id" IN (
  SELECT p2."id"
  FROM "broker_ad_simulation_performances" AS p2
  WHERE p2."id" NOT IN (
    SELECT DISTINCT ON ("campaign_id") "id"
    FROM "broker_ad_simulation_performances"
    ORDER BY "campaign_id" ASC, "created_at" DESC
  )
);

ALTER TABLE "broker_ad_simulation_performances"
  ADD CONSTRAINT "BrokerAdSimulationPerformance_campaignId_key" UNIQUE ("campaign_id");
