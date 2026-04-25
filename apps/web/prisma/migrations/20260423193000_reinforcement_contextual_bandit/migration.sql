-- Contextual bandit policy + arm stats + auditable decisions (ranking only; no auto-exec).

-- CreateEnum
CREATE TYPE "ReinforcementPolicyType" AS ENUM ('EPSILON_GREEDY', 'UCB_LITE');
CREATE TYPE "ReinforcementBanditMode" AS ENUM ('exploit', 'explore');

-- CreateTable
CREATE TABLE "reinforcement_policies" (
    "id" TEXT NOT NULL,
    "domain" "StrategyBenchmarkDomain" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "policy_type" "ReinforcementPolicyType" NOT NULL,
    "exploration_rate" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "reinforcement_policies_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "reinforcement_policies_domain_is_active_idx" ON "reinforcement_policies"("domain", "is_active");

CREATE TABLE "reinforcement_arm_stats" (
    "id" TEXT NOT NULL,
    "strategy_key" VARCHAR(128) NOT NULL,
    "domain" "StrategyBenchmarkDomain" NOT NULL,
    "context_bucket" VARCHAR(256) NOT NULL,
    "pulls" INTEGER NOT NULL DEFAULT 0,
    "rewards_sum" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avg_reward" DOUBLE PRECISION,
    "wins" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "losses" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stalls" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "reinforcement_arm_stats_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "reinforcement_arm_stats_strategy_domain_bucket" ON "reinforcement_arm_stats"("strategy_key", "domain", "context_bucket");
CREATE INDEX "reinforcement_arm_stats_domain_context_bucket_idx" ON "reinforcement_arm_stats"("domain", "context_bucket");

CREATE TABLE "reinforcement_decisions" (
    "id" TEXT NOT NULL,
    "domain" "StrategyBenchmarkDomain" NOT NULL,
    "strategy_key" VARCHAR(128) NOT NULL,
    "deal_id" TEXT,
    "conversation_id" TEXT,
    "broker_id" TEXT,
    "context_bucket" VARCHAR(256) NOT NULL,
    "selection_mode" "ReinforcementBanditMode" NOT NULL,
    "base_score" DOUBLE PRECISION NOT NULL,
    "adjusted_score" DOUBLE PRECISION NOT NULL,
    "reward_observed" DOUBLE PRECISION,
    "outcome_observed" "StrategyBucketOutcome",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "reinforcement_decisions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "reinforcement_decisions_deal_id_created_at_idx" ON "reinforcement_decisions"("deal_id", "created_at");
CREATE INDEX "reinforcement_decisions_domain_created_at_idx" ON "reinforcement_decisions"("domain", "created_at");
CREATE INDEX "reinforcement_decisions_broker_id_created_at_idx" ON "reinforcement_decisions"("broker_id", "created_at");

ALTER TABLE "reinforcement_decisions" ADD CONSTRAINT "reinforcement_decisions_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
