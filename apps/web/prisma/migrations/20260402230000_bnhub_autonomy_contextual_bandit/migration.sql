-- BNHub autonomy: contextual bandit stats + action context snapshot.

ALTER TABLE "autonomy_actions" ADD COLUMN IF NOT EXISTS "context_features_json" JSONB;

ALTER TABLE "autonomy_rule_weights" ADD COLUMN IF NOT EXISTS "feature_profile_json" JSONB;
ALTER TABLE "autonomy_rule_weights" ADD COLUMN IF NOT EXISTS "context_success_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "autonomy_rule_weights" ADD COLUMN IF NOT EXISTS "context_failure_count" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "contextual_action_stats" (
    "id" TEXT NOT NULL,
    "scope_type" VARCHAR(24) NOT NULL,
    "scope_id" TEXT NOT NULL,
    "domain" VARCHAR(32) NOT NULL,
    "signal_key" VARCHAR(48) NOT NULL,
    "action_type" VARCHAR(48) NOT NULL,
    "feature_key" VARCHAR(48) NOT NULL,
    "feature_bucket" VARCHAR(48) NOT NULL,
    "success_count" INTEGER NOT NULL DEFAULT 0,
    "failure_count" INTEGER NOT NULL DEFAULT 0,
    "average_reward" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_reward" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contextual_action_stats_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "contextual_action_stats_scope_type_scope_id_domain_signal_key_action_typ_key"
ON "contextual_action_stats"(
  "scope_type",
  "scope_id",
  "domain",
  "signal_key",
  "action_type",
  "feature_key",
  "feature_bucket"
);

CREATE INDEX IF NOT EXISTS "contextual_action_stats_scope_type_scope_id_updated_at_idx"
ON "contextual_action_stats"("scope_type", "scope_id", "updated_at");
