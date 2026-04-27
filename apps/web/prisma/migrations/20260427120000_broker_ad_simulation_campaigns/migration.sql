-- Order 38: broker ad simulation (draft/schedule/run; no real ad platform spend)

CREATE TABLE "broker_ad_simulation_campaigns" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "audience" VARCHAR(32) NOT NULL,
    "city" VARCHAR(120),
    "platform" VARCHAR(16) NOT NULL,
    "headline" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" VARCHAR(24) NOT NULL DEFAULT 'draft',
    "scheduled_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "broker_ad_simulation_campaigns_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "broker_ad_simulation_performances" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "impressions" INTEGER NOT NULL,
    "clicks" INTEGER NOT NULL,
    "conversions" INTEGER NOT NULL,
    "spend" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "broker_ad_simulation_performances_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "broker_ad_simulation_campaigns_user_id_created_at_idx" ON "broker_ad_simulation_campaigns"("user_id", "created_at");
CREATE INDEX "broker_ad_simulation_performances_campaign_id_created_at_idx" ON "broker_ad_simulation_performances"("campaign_id", "created_at");

ALTER TABLE "broker_ad_simulation_performances" ADD CONSTRAINT "broker_ad_simulation_performances_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "broker_ad_simulation_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
