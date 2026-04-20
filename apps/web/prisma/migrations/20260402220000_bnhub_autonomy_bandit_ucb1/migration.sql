-- BNHub autonomy: UCB1 bandit fields + max actions per cycle.

ALTER TABLE "autonomy_configs" ADD COLUMN IF NOT EXISTS "max_actions_per_cycle" INTEGER DEFAULT 2;

ALTER TABLE "autonomy_rule_weights" ADD COLUMN IF NOT EXISTS "selection_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "autonomy_rule_weights" ADD COLUMN IF NOT EXISTS "average_reward" DOUBLE PRECISION NOT NULL DEFAULT 0;
