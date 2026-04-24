-- Autonomous rollout: policy, execution, metric snapshots, decision log

CREATE TYPE "RolloutPolicyDomain" AS ENUM ('PRICING', 'RANKING', 'MESSAGING', 'DEAL', 'ESG');
CREATE TYPE "RolloutPolicySource" AS ENUM ('AGENT', 'EVOLUTION', 'MANUAL');
CREATE TYPE "RolloutPolicyStatus" AS ENUM ('DRAFT', 'APPROVED', 'LIVE', 'PAUSED', 'ROLLED_BACK');
CREATE TYPE "RolloutExecutionStatus" AS ENUM ('RUNNING', 'PAUSED', 'COMPLETED', 'ROLLED_BACK');
CREATE TYPE "RolloutDecisionAction" AS ENUM ('INCREASE', 'PAUSE', 'ROLLBACK');

CREATE TABLE "rollout_policies" (
    "id" TEXT NOT NULL,
    "domain" "RolloutPolicyDomain" NOT NULL,
    "strategy_key" VARCHAR(128) NOT NULL,
    "payload_json" JSONB NOT NULL,
    "source" "RolloutPolicySource" NOT NULL,
    "status" "RolloutPolicyStatus" NOT NULL DEFAULT 'DRAFT',
    "created_by_user_id" VARCHAR(36),
    "approved_by_user_id" VARCHAR(36),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_at" TIMESTAMP(3),

    CONSTRAINT "rollout_policies_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "rollout_executions" (
    "id" TEXT NOT NULL,
    "policy_id" TEXT NOT NULL,
    "rollout_percent" INTEGER NOT NULL,
    "cohort_key" VARCHAR(128) NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_evaluated_at" TIMESTAMP(3),
    "status" "RolloutExecutionStatus" NOT NULL DEFAULT 'RUNNING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rollout_executions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "rollout_metric_snapshots" (
    "id" TEXT NOT NULL,
    "execution_id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metrics_json" JSONB NOT NULL,

    CONSTRAINT "rollout_metric_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "rollout_decision_logs" (
    "id" TEXT NOT NULL,
    "execution_id" TEXT NOT NULL,
    "action" "RolloutDecisionAction" NOT NULL,
    "reason" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rollout_decision_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "rollout_policies_domain_strategy_key_status_idx" ON "rollout_policies"("domain", "strategy_key", "status");
CREATE INDEX "rollout_policies_status_created_at_idx" ON "rollout_policies"("status", "created_at" DESC);

CREATE INDEX "rollout_executions_policy_id_status_idx" ON "rollout_executions"("policy_id", "status");
CREATE INDEX "rollout_executions_status_started_at_idx" ON "rollout_executions"("status", "started_at" DESC);

CREATE INDEX "rollout_metric_snapshots_execution_id_timestamp_idx" ON "rollout_metric_snapshots"("execution_id", "timestamp" DESC);

CREATE INDEX "rollout_decision_logs_execution_id_created_at_idx" ON "rollout_decision_logs"("execution_id", "created_at" DESC);

ALTER TABLE "rollout_executions" ADD CONSTRAINT "rollout_executions_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "rollout_policies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "rollout_metric_snapshots" ADD CONSTRAINT "rollout_metric_snapshots_execution_id_fkey" FOREIGN KEY ("execution_id") REFERENCES "rollout_executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "rollout_decision_logs" ADD CONSTRAINT "rollout_decision_logs_execution_id_fkey" FOREIGN KEY ("execution_id") REFERENCES "rollout_executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
