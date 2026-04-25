-- CreateEnum
CREATE TYPE "StrategyBenchmarkDomain" AS ENUM ('NEGOTIATION', 'CLOSING', 'OFFER');

-- CreateEnum
CREATE TYPE "StrategyBucketOutcome" AS ENUM ('WON', 'LOST', 'STALLED');

-- CreateTable
CREATE TABLE "strategy_execution_events" (
    "id" TEXT NOT NULL,
    "strategy_key" VARCHAR(128) NOT NULL,
    "domain" "StrategyBenchmarkDomain" NOT NULL,
    "deal_id" TEXT,
    "conversation_id" TEXT,
    "broker_id" TEXT,
    "client_id" TEXT,
    "context_snapshot" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "strategy_execution_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "strategy_outcome_events" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "outcome" "StrategyBucketOutcome" NOT NULL,
    "closing_time_days" DOUBLE PRECISION,
    "final_stage" VARCHAR(64),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "strategy_outcome_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "strategy_performance_aggregates" (
    "id" TEXT NOT NULL,
    "strategy_key" VARCHAR(128) NOT NULL,
    "domain" "StrategyBenchmarkDomain" NOT NULL,
    "total_uses" INTEGER NOT NULL DEFAULT 0,
    "wins" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "losses" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stalls" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avg_closing_time" DOUBLE PRECISION,
    "closing_samples" INTEGER NOT NULL DEFAULT 0,
    "last_updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "strategy_performance_aggregates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "strategy_execution_events_deal_id_created_at_idx" ON "strategy_execution_events"("deal_id", "created_at");

-- CreateIndex
CREATE INDEX "strategy_execution_events_strategy_key_domain_idx" ON "strategy_execution_events"("strategy_key", "domain");

-- CreateIndex
CREATE INDEX "strategy_execution_events_broker_id_created_at_idx" ON "strategy_execution_events"("broker_id", "created_at");

-- CreateIndex
CREATE INDEX "strategy_outcome_events_outcome_created_at_idx" ON "strategy_outcome_events"("outcome", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "strategy_outcome_events_deal_id_key" ON "strategy_outcome_events"("deal_id");

-- CreateIndex
CREATE INDEX "strategy_performance_aggregates_domain_last_updated_at_idx" ON "strategy_performance_aggregates"("domain", "last_updated_at");

-- CreateIndex
CREATE UNIQUE INDEX "strategy_performance_aggregates_strategy_key_domain_key" ON "strategy_performance_aggregates"("strategy_key", "domain");

-- AddForeignKey
ALTER TABLE "strategy_execution_events" ADD CONSTRAINT "strategy_execution_events_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strategy_outcome_events" ADD CONSTRAINT "strategy_outcome_events_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
