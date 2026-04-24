-- LECIPM Opportunity Discovery AI — additive

CREATE TYPE "LecipmDiscoveryEntityType" AS ENUM ('LISTING', 'DEAL', 'SHORT_TERM_UNIT', 'INVESTMENT');

CREATE TYPE "LecipmOpportunityKind" AS ENUM (
  'UNDERVALUED',
  'VALUE_ADD',
  'HIGH_DEMAND',
  'ESG_UPSIDE',
  'INVESTOR_FIT',
  'ARBITRAGE'
);

CREATE TYPE "LecipmOpportunityCandidateStatus" AS ENUM ('NEW', 'REVIEWED', 'DISMISSED', 'ACTIONED');

CREATE TYPE "LecipmOpportunityRiskTier" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

CREATE TYPE "LecipmOpportunityOutcomeKind" AS ENUM (
  'CONTACTED',
  'OFFER_SENT',
  'BOOKED',
  'INVESTED',
  'CLOSED',
  'DISMISSED'
);

CREATE TABLE "lecipm_opportunity_candidates" (
  "id" TEXT NOT NULL,
  "broker_user_id" TEXT NOT NULL,
  "entity_type" "LecipmDiscoveryEntityType" NOT NULL,
  "entity_id" VARCHAR(64) NOT NULL,
  "opportunity_type" "LecipmOpportunityKind" NOT NULL,
  "score" INTEGER NOT NULL,
  "confidence_score" INTEGER NOT NULL,
  "risk_level" "LecipmOpportunityRiskTier" NOT NULL,
  "rationale_json" JSONB NOT NULL,
  "discovered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "status" "LecipmOpportunityCandidateStatus" NOT NULL DEFAULT 'NEW',
  "idempotency_key" VARCHAR(192),
  "city" VARCHAR(128),
  "property_type" VARCHAR(64),
  "market_segment" VARCHAR(64),
  "investor_ready" BOOLEAN NOT NULL DEFAULT false,
  "esg_relevant" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "lecipm_opportunity_candidates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "lecipm_opportunity_outcomes" (
  "id" TEXT NOT NULL,
  "opportunity_id" TEXT NOT NULL,
  "outcome_type" "LecipmOpportunityOutcomeKind" NOT NULL,
  "outcome_value_json" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "lecipm_opportunity_outcomes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "lecipm_opportunity_candidates_idempotency_key_key" ON "lecipm_opportunity_candidates"("idempotency_key");

CREATE INDEX "lecipm_opportunity_candidates_broker_user_id_status_score_idx" ON "lecipm_opportunity_candidates"("broker_user_id", "status", "score" DESC);

CREATE INDEX "lecipm_opportunity_candidates_broker_user_id_opportunity_type_idx" ON "lecipm_opportunity_candidates"("broker_user_id", "opportunity_type");

CREATE INDEX "lecipm_opportunity_candidates_city_idx" ON "lecipm_opportunity_candidates"("city");

CREATE INDEX "lecipm_opportunity_candidates_entity_type_entity_id_idx" ON "lecipm_opportunity_candidates"("entity_type", "entity_id");

CREATE INDEX "lecipm_opportunity_outcomes_opportunity_id_created_at_idx" ON "lecipm_opportunity_outcomes"("opportunity_id", "created_at");

ALTER TABLE "lecipm_opportunity_candidates" ADD CONSTRAINT "lecipm_opportunity_candidates_broker_user_id_fkey" FOREIGN KEY ("broker_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lecipm_opportunity_outcomes" ADD CONSTRAINT "lecipm_opportunity_outcomes_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "lecipm_opportunity_candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
