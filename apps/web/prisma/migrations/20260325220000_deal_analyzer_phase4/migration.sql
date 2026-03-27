-- Phase 4 — automation + market adaptation (Deal Analyzer)

CREATE TABLE "deal_analysis_refresh_jobs" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "analysis_id" TEXT,
    "refresh_type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "trigger_source" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deal_analysis_refresh_jobs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "deal_analysis_refresh_events" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "analysis_id" TEXT,
    "event_type" TEXT NOT NULL,
    "previous_state" JSONB,
    "new_state" JSONB,
    "confidence_delta" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deal_analysis_refresh_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "deal_negotiation_playbooks" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "analysis_id" TEXT,
    "offer_strategy_id" TEXT,
    "market_condition" TEXT NOT NULL,
    "posture" TEXT NOT NULL,
    "playbook_steps" JSONB NOT NULL DEFAULT '[]',
    "warnings" JSONB NOT NULL DEFAULT '[]',
    "confidence_level" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deal_negotiation_playbooks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "seller_repricing_reviews" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "current_price_cents" INTEGER NOT NULL,
    "current_position" TEXT NOT NULL,
    "suggested_action" TEXT NOT NULL,
    "confidence_level" TEXT NOT NULL,
    "reasons" JSONB NOT NULL DEFAULT '[]',
    "explanation" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seller_repricing_reviews_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "seller_repricing_reviews_property_id_key" ON "seller_repricing_reviews"("property_id");

CREATE TABLE "seller_repricing_triggers" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "trigger_type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seller_repricing_triggers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "portfolio_monitoring_snapshots" (
    "id" TEXT NOT NULL,
    "watchlist_id" TEXT NOT NULL,
    "summary" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portfolio_monitoring_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "portfolio_monitoring_events" (
    "id" TEXT NOT NULL,
    "watchlist_id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "status" TEXT NOT NULL DEFAULT 'unread',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "portfolio_monitoring_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_deal_refresh_jobs_property_id" ON "deal_analysis_refresh_jobs"("property_id");
CREATE INDEX "idx_deal_refresh_jobs_status" ON "deal_analysis_refresh_jobs"("status");
CREATE INDEX "idx_deal_refresh_events_property_id" ON "deal_analysis_refresh_events"("property_id");
CREATE INDEX "idx_deal_negotiation_playbooks_property_id" ON "deal_negotiation_playbooks"("property_id");
CREATE INDEX "idx_seller_repricing_triggers_property_id" ON "seller_repricing_triggers"("property_id");
CREATE INDEX "idx_seller_repricing_triggers_status" ON "seller_repricing_triggers"("status");
CREATE INDEX "idx_portfolio_monitoring_snapshots_watchlist_id" ON "portfolio_monitoring_snapshots"("watchlist_id");
CREATE INDEX "idx_portfolio_monitoring_events_watchlist_id" ON "portfolio_monitoring_events"("watchlist_id");
CREATE INDEX "idx_portfolio_monitoring_events_property_id" ON "portfolio_monitoring_events"("property_id");

ALTER TABLE "deal_analysis_refresh_jobs" ADD CONSTRAINT "deal_analysis_refresh_jobs_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "fsbo_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "deal_analysis_refresh_jobs" ADD CONSTRAINT "deal_analysis_refresh_jobs_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "deal_analyses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "deal_analysis_refresh_events" ADD CONSTRAINT "deal_analysis_refresh_events_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "fsbo_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "deal_analysis_refresh_events" ADD CONSTRAINT "deal_analysis_refresh_events_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "deal_analyses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "deal_negotiation_playbooks" ADD CONSTRAINT "deal_negotiation_playbooks_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "fsbo_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "deal_negotiation_playbooks" ADD CONSTRAINT "deal_negotiation_playbooks_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "deal_analyses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "deal_negotiation_playbooks" ADD CONSTRAINT "deal_negotiation_playbooks_offer_strategy_id_fkey" FOREIGN KEY ("offer_strategy_id") REFERENCES "deal_offer_strategies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "seller_repricing_reviews" ADD CONSTRAINT "seller_repricing_reviews_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "fsbo_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "seller_repricing_triggers" ADD CONSTRAINT "seller_repricing_triggers_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "fsbo_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "portfolio_monitoring_snapshots" ADD CONSTRAINT "portfolio_monitoring_snapshots_watchlist_id_fkey" FOREIGN KEY ("watchlist_id") REFERENCES "deal_watchlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "portfolio_monitoring_events" ADD CONSTRAINT "portfolio_monitoring_events_watchlist_id_fkey" FOREIGN KEY ("watchlist_id") REFERENCES "deal_watchlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "portfolio_monitoring_events" ADD CONSTRAINT "portfolio_monitoring_events_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "fsbo_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
