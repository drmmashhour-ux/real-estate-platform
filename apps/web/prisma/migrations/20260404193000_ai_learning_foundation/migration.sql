-- Host Autopilot learning: outcome signals + per-rule aggregates

CREATE TABLE "ai_outcome_signals" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "host_id" TEXT NOT NULL,
    "listing_id" TEXT,
    "booking_id" TEXT,
    "rule_name" TEXT NOT NULL,
    "action_type" TEXT NOT NULL,
    "outcome_type" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "ai_outcome_signals_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ai_outcome_signals_host_id_created_at_idx" ON "ai_outcome_signals"("host_id", "created_at");
CREATE INDEX "ai_outcome_signals_rule_name_idx" ON "ai_outcome_signals"("rule_name");

CREATE TABLE "ai_rule_performance" (
    "id" TEXT NOT NULL,
    "rule_name" TEXT NOT NULL,
    "total" INTEGER NOT NULL DEFAULT 0,
    "success_count" INTEGER NOT NULL DEFAULT 0,
    "failure_count" INTEGER NOT NULL DEFAULT 0,
    "last_updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_rule_performance_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ai_rule_performance_rule_name_key" ON "ai_rule_performance"("rule_name");
