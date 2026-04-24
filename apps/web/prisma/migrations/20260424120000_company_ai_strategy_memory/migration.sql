-- CreateEnum
CREATE TYPE "CompanyStrategyDomain" AS ENUM ('GROWTH', 'DEALS', 'EXECUTION', 'INVESTMENT', 'ESG', 'FINANCE', 'MARKETPLACE');

-- CreateEnum
CREATE TYPE "CompanyAdaptationSource" AS ENUM ('CEO', 'EVOLUTION', 'PORTFOLIO', 'OPPORTUNITY', 'COMMAND_CENTER');

-- CreateEnum
CREATE TYPE "CompanyAdaptationType" AS ENUM ('WEIGHT_SHIFT', 'PRIORITY_SHIFT', 'SEGMENT_FOCUS_CHANGE', 'RISK_TIGHTENING', 'RESOURCE_REALLOCATION', 'EXPERIMENT_RECOMMENDATION');

-- CreateEnum
CREATE TYPE "CompanyAdaptationStatus" AS ENUM ('PROPOSED', 'APPROVED', 'REJECTED', 'ROLLED_OUT');

-- CreateEnum
CREATE TYPE "CompanyOutcomePeriodType" AS ENUM ('WEEKLY', 'MONTHLY', 'QUARTERLY');

-- CreateTable
CREATE TABLE "company_strategy_memories" (
    "id" TEXT NOT NULL,
    "domain" "CompanyStrategyDomain" NOT NULL,
    "strategy_key" VARCHAR(160) NOT NULL,
    "times_applied" INTEGER NOT NULL DEFAULT 0,
    "positive_outcomes" INTEGER NOT NULL DEFAULT 0,
    "neutral_outcomes" INTEGER NOT NULL DEFAULT 0,
    "negative_outcomes" INTEGER NOT NULL DEFAULT 0,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "last_outcome_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_strategy_memories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_adaptation_events" (
    "id" TEXT NOT NULL,
    "source" "CompanyAdaptationSource" NOT NULL,
    "adaptation_type" "CompanyAdaptationType" NOT NULL,
    "domain" "CompanyStrategyDomain" NOT NULL,
    "previous_state_json" JSONB NOT NULL,
    "proposed_state_json" JSONB NOT NULL,
    "rationale_json" JSONB NOT NULL,
    "confidence_score" DOUBLE PRECISION NOT NULL,
    "status" "CompanyAdaptationStatus" NOT NULL DEFAULT 'PROPOSED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_at" TIMESTAMP(3),
    "approved_by_user_id" VARCHAR(36),
    "rejected_at" TIMESTAMP(3),
    "rejected_by_user_id" VARCHAR(36),

    CONSTRAINT "company_adaptation_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_outcome_windows" (
    "id" TEXT NOT NULL,
    "period_type" "CompanyOutcomePeriodType" NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "metrics_json" JSONB NOT NULL,
    "conclusions_json" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_outcome_windows_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "company_strategy_memories_domain_strategy_key_key" ON "company_strategy_memories"("domain", "strategy_key");

-- CreateIndex
CREATE INDEX "company_strategy_memories_domain_score_idx" ON "company_strategy_memories"("domain", "score" DESC);

-- CreateIndex
CREATE INDEX "company_adaptation_events_status_created_at_idx" ON "company_adaptation_events"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "company_adaptation_events_domain_status_idx" ON "company_adaptation_events"("domain", "status");

-- CreateIndex
CREATE INDEX "company_outcome_windows_period_type_period_end_idx" ON "company_outcome_windows"("period_type", "period_end" DESC);
