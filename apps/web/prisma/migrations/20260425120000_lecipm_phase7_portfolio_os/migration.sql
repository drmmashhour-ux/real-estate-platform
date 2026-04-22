-- Phase 7: Portfolio OS (broker portfolios, performance, health, AI decisions, capital proposals)
CREATE TABLE "lecipm_broker_portfolios" (
    "id" TEXT NOT NULL,
    "owner_user_id" VARCHAR(36) NOT NULL,
    "name" VARCHAR(512) NOT NULL,
    "description" TEXT,
    "total_value" DOUBLE PRECISION,
    "total_assets" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "lecipm_broker_portfolios_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lecipm_broker_portfolios_owner_user_id_idx" ON "lecipm_broker_portfolios"("owner_user_id");

ALTER TABLE "lecipm_broker_portfolios"
  ADD CONSTRAINT "lecipm_broker_portfolios_owner_user_id_fkey"
  FOREIGN KEY ("owner_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "lecipm_broker_portfolio_asset_links" (
    "id" TEXT NOT NULL,
    "portfolio_id" VARCHAR(36) NOT NULL,
    "asset_id" VARCHAR(36) NOT NULL,
    "allocation_weight" DOUBLE PRECISION,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "lecipm_broker_portfolio_asset_links_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "lecipm_broker_portfolio_asset_links_portfolio_id_asset_id_key"
  ON "lecipm_broker_portfolio_asset_links"("portfolio_id", "asset_id");

CREATE INDEX "lecipm_broker_portfolio_asset_links_asset_id_idx"
  ON "lecipm_broker_portfolio_asset_links"("asset_id");

ALTER TABLE "lecipm_broker_portfolio_asset_links"
  ADD CONSTRAINT "lecipm_broker_portfolio_asset_links_portfolio_id_fkey"
  FOREIGN KEY ("portfolio_id") REFERENCES "lecipm_broker_portfolios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lecipm_broker_portfolio_asset_links"
  ADD CONSTRAINT "lecipm_broker_portfolio_asset_links_asset_id_fkey"
  FOREIGN KEY ("asset_id") REFERENCES "lecipm_portfolio_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "lecipm_portfolio_asset_performance" (
    "id" TEXT NOT NULL,
    "asset_id" VARCHAR(36) NOT NULL,
    "revenue" DOUBLE PRECISION,
    "expenses" DOUBLE PRECISION,
    "noi" DOUBLE PRECISION,
    "occupancy_rate" DOUBLE PRECISION,
    "period" VARCHAR(16) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "lecipm_portfolio_asset_performance_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lecipm_portfolio_asset_performance_asset_id_created_at_idx"
  ON "lecipm_portfolio_asset_performance"("asset_id", "created_at" DESC);

ALTER TABLE "lecipm_portfolio_asset_performance"
  ADD CONSTRAINT "lecipm_portfolio_asset_performance_asset_id_fkey"
  FOREIGN KEY ("asset_id") REFERENCES "lecipm_portfolio_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "lecipm_portfolio_asset_health_scores" (
    "id" TEXT NOT NULL,
    "asset_id" VARCHAR(36) NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "band" VARCHAR(8) NOT NULL,
    "risk_level" VARCHAR(16) NOT NULL,
    "performance_level" VARCHAR(16) NOT NULL,
    "rationale_public" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "lecipm_portfolio_asset_health_scores_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lecipm_portfolio_asset_health_scores_asset_id_created_at_idx"
  ON "lecipm_portfolio_asset_health_scores"("asset_id", "created_at" DESC);

ALTER TABLE "lecipm_portfolio_asset_health_scores"
  ADD CONSTRAINT "lecipm_portfolio_asset_health_scores_asset_id_fkey"
  FOREIGN KEY ("asset_id") REFERENCES "lecipm_portfolio_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "lecipm_broker_portfolio_decisions" (
    "id" TEXT NOT NULL,
    "portfolio_id" VARCHAR(36) NOT NULL,
    "asset_id" VARCHAR(36),
    "decision_type" VARCHAR(24) NOT NULL,
    "rationale" TEXT NOT NULL,
    "confidence_score" DOUBLE PRECISION,
    "requires_approval" BOOLEAN NOT NULL DEFAULT true,
    "status" VARCHAR(16) NOT NULL DEFAULT 'PROPOSED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "lecipm_broker_portfolio_decisions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lecipm_broker_portfolio_decisions_portfolio_id_idx"
  ON "lecipm_broker_portfolio_decisions"("portfolio_id");

ALTER TABLE "lecipm_broker_portfolio_decisions"
  ADD CONSTRAINT "lecipm_broker_portfolio_decisions_portfolio_id_fkey"
  FOREIGN KEY ("portfolio_id") REFERENCES "lecipm_broker_portfolios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lecipm_broker_portfolio_decisions"
  ADD CONSTRAINT "lecipm_broker_portfolio_decisions_asset_id_fkey"
  FOREIGN KEY ("asset_id") REFERENCES "lecipm_portfolio_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "lecipm_capital_allocation_proposals" (
    "id" TEXT NOT NULL,
    "portfolio_id" VARCHAR(36) NOT NULL,
    "total_budget" DOUBLE PRECISION NOT NULL,
    "allocation_json" JSONB NOT NULL,
    "rationale" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "lecipm_capital_allocation_proposals_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lecipm_capital_allocation_proposals_portfolio_id_idx"
  ON "lecipm_capital_allocation_proposals"("portfolio_id");

ALTER TABLE "lecipm_capital_allocation_proposals"
  ADD CONSTRAINT "lecipm_capital_allocation_proposals_portfolio_id_fkey"
  FOREIGN KEY ("portfolio_id") REFERENCES "lecipm_broker_portfolios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "lecipm_portfolio_os_audit_events" (
    "id" TEXT NOT NULL,
    "portfolio_id" VARCHAR(36) NOT NULL,
    "event_type" VARCHAR(64) NOT NULL,
    "summary" TEXT NOT NULL,
    "actor_user_id" VARCHAR(36),
    "metadata_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "lecipm_portfolio_os_audit_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lecipm_portfolio_os_audit_events_portfolio_id_created_at_idx"
  ON "lecipm_portfolio_os_audit_events"("portfolio_id", "created_at");

ALTER TABLE "lecipm_portfolio_os_audit_events"
  ADD CONSTRAINT "lecipm_portfolio_os_audit_events_portfolio_id_fkey"
  FOREIGN KEY ("portfolio_id") REFERENCES "lecipm_broker_portfolios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
