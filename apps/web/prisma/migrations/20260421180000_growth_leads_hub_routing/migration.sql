-- Leads Hub: broker route (RE vs mortgage), urgency, platform mortgage priority flag.
CREATE TYPE "GrowthEngineBrokerRoute" AS ENUM ('unspecified', 'real_estate', 'mortgage', 'both');
CREATE TYPE "GrowthEngineLeadUrgency" AS ENUM ('unspecified', 'hot', 'mid', 'long_term');

ALTER TABLE "growth_engine_leads" ADD COLUMN "broker_route" "GrowthEngineBrokerRoute" NOT NULL DEFAULT 'unspecified';
ALTER TABLE "growth_engine_leads" ADD COLUMN "lead_urgency" "GrowthEngineLeadUrgency" NOT NULL DEFAULT 'unspecified';
ALTER TABLE "growth_engine_leads" ADD COLUMN "prefer_platform_mortgage_expert" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "growth_engine_leads_broker_route_idx" ON "growth_engine_leads"("broker_route");
CREATE INDEX "growth_engine_leads_lead_urgency_idx" ON "growth_engine_leads"("lead_urgency");
