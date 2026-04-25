-- Brokerage portfolio intelligence: snapshots, routing audit, deal priority, load, segment aggregates.

CREATE TABLE "portfolio_snapshots" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "total_leads" INTEGER NOT NULL,
    "total_active_deals" INTEGER NOT NULL,
    "total_won_deals" INTEGER NOT NULL,
    "total_lost_deals" INTEGER NOT NULL,
    "avg_deal_cycle_days" DOUBLE PRECISION,
    "broker_load_distribution_json" JSONB NOT NULL,
    "segment_performance_json" JSONB NOT NULL,
    CONSTRAINT "portfolio_snapshots_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "portfolio_snapshots_created_at_idx" ON "portfolio_snapshots"("created_at");

CREATE TABLE "lead_routing_decisions" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "recommended_broker_id" TEXT NOT NULL,
    "alternative_broker_ids" JSONB NOT NULL,
    "rationale_json" JSONB NOT NULL,
    "context_bucket" VARCHAR(256) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "lead_routing_decisions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "lead_routing_decisions_lead_id_created_at_idx" ON "lead_routing_decisions"("lead_id", "created_at");
CREATE INDEX "lead_routing_decisions_recommended_broker_id_created_at_idx" ON "lead_routing_decisions"("recommended_broker_id", "created_at");
ALTER TABLE "lead_routing_decisions" ADD CONSTRAINT "lead_routing_decisions_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lead_routing_decisions" ADD CONSTRAINT "lead_routing_decisions_recommended_broker_id_fkey" FOREIGN KEY ("recommended_broker_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "deal_priority_scores" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "priority_score" DOUBLE PRECISION NOT NULL,
    "risk_level" VARCHAR(32) NOT NULL,
    "urgency_level" VARCHAR(32) NOT NULL,
    "rationale_json" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "deal_priority_scores_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "deal_priority_scores_deal_id_created_at_idx" ON "deal_priority_scores"("deal_id", "created_at");
CREATE INDEX "deal_priority_scores_priority_score_idx" ON "deal_priority_scores"("priority_score");
ALTER TABLE "deal_priority_scores" ADD CONSTRAINT "deal_priority_scores_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "broker_load_metrics" (
    "id" TEXT NOT NULL,
    "broker_id" TEXT NOT NULL,
    "active_deals" INTEGER NOT NULL DEFAULT 0,
    "active_leads" INTEGER NOT NULL DEFAULT 0,
    "avg_response_time" DOUBLE PRECISION,
    "workload_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "last_updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "broker_load_metrics_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "broker_load_metrics_broker_id_key" ON "broker_load_metrics"("broker_id");
CREATE INDEX "broker_load_metrics_workload_score_idx" ON "broker_load_metrics"("workload_score");
ALTER TABLE "broker_load_metrics" ADD CONSTRAINT "broker_load_metrics_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "segment_performance_aggregates" (
    "id" TEXT NOT NULL,
    "segment_key" VARCHAR(256) NOT NULL,
    "total_deals" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "avg_closing_time" DOUBLE PRECISION,
    "win_rate" DOUBLE PRECISION,
    "last_updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "segment_performance_aggregates_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "segment_performance_aggregates_segment_key_key" ON "segment_performance_aggregates"("segment_key");
CREATE INDEX "segment_performance_aggregates_win_rate_idx" ON "segment_performance_aggregates"("win_rate");
