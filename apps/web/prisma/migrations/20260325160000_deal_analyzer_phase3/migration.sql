-- Deal Analyzer Phase 3: offer strategy, affordability, watchlists, alerts, seller pricing advice

CREATE TABLE IF NOT EXISTS "deal_offer_strategies" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "analysis_id" TEXT,
    "suggested_min_offer_cents" INTEGER,
    "suggested_target_offer_cents" INTEGER,
    "suggested_max_offer_cents" INTEGER,
    "confidence_level" TEXT NOT NULL,
    "competition_signal" TEXT,
    "risk_level" TEXT NOT NULL,
    "offer_band" TEXT NOT NULL,
    "offer_posture" TEXT NOT NULL,
    "recommended_conditions" JSONB NOT NULL DEFAULT '[]',
    "warnings" JSONB NOT NULL DEFAULT '[]',
    "explanation" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deal_offer_strategies_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_deal_offer_strategies_property_id" ON "deal_offer_strategies"("property_id");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'deal_offer_strategies_property_id_fkey') THEN
    ALTER TABLE "deal_offer_strategies" ADD CONSTRAINT "deal_offer_strategies_property_id_fkey"
      FOREIGN KEY ("property_id") REFERENCES "fsbo_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'deal_offer_strategies_analysis_id_fkey') THEN
    ALTER TABLE "deal_offer_strategies" ADD CONSTRAINT "deal_offer_strategies_analysis_id_fkey"
      FOREIGN KEY ("analysis_id") REFERENCES "deal_analyses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "deal_affordability_analyses" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "down_payment_cents" INTEGER,
    "interest_rate" DECIMAL(7,6),
    "amortization_years" INTEGER,
    "monthly_income_cents" INTEGER,
    "monthly_debts_cents" INTEGER,
    "estimated_monthly_payment_cents" INTEGER,
    "affordability_level" TEXT NOT NULL,
    "affordability_ratio" DECIMAL(8,4),
    "confidence_level" TEXT NOT NULL,
    "warnings" JSONB NOT NULL DEFAULT '[]',
    "explanation" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deal_affordability_analyses_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_deal_affordability_property_id" ON "deal_affordability_analyses"("property_id");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'deal_affordability_analyses_property_id_fkey') THEN
    ALTER TABLE "deal_affordability_analyses" ADD CONSTRAINT "deal_affordability_analyses_property_id_fkey"
      FOREIGN KEY ("property_id") REFERENCES "fsbo_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "deal_watchlists" (
    "id" TEXT NOT NULL,
    "owner_type" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deal_watchlists_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_deal_watchlists_owner_id" ON "deal_watchlists"("owner_id");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'deal_watchlists_owner_id_fkey') THEN
    ALTER TABLE "deal_watchlists" ADD CONSTRAINT "deal_watchlists_owner_id_fkey"
      FOREIGN KEY ("owner_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "deal_watchlist_items" (
    "id" TEXT NOT NULL,
    "watchlist_id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "last_investment_score" INTEGER,
    "last_risk_score" INTEGER,
    "last_opportunity_type" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deal_watchlist_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "deal_watchlist_items_watchlist_id_property_id_key" ON "deal_watchlist_items"("watchlist_id", "property_id");
CREATE INDEX IF NOT EXISTS "idx_deal_watchlist_items_property_id" ON "deal_watchlist_items"("property_id");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'deal_watchlist_items_watchlist_id_fkey') THEN
    ALTER TABLE "deal_watchlist_items" ADD CONSTRAINT "deal_watchlist_items_watchlist_id_fkey"
      FOREIGN KEY ("watchlist_id") REFERENCES "deal_watchlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'deal_watchlist_items_property_id_fkey') THEN
    ALTER TABLE "deal_watchlist_items" ADD CONSTRAINT "deal_watchlist_items_property_id_fkey"
      FOREIGN KEY ("property_id") REFERENCES "fsbo_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "deal_portfolio_alerts" (
    "id" TEXT NOT NULL,
    "watchlist_id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "alert_type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'unread',
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deal_portfolio_alerts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_deal_portfolio_alerts_watchlist_id" ON "deal_portfolio_alerts"("watchlist_id");
CREATE INDEX IF NOT EXISTS "idx_deal_portfolio_alerts_property_id" ON "deal_portfolio_alerts"("property_id");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'deal_portfolio_alerts_watchlist_id_fkey') THEN
    ALTER TABLE "deal_portfolio_alerts" ADD CONSTRAINT "deal_portfolio_alerts_watchlist_id_fkey"
      FOREIGN KEY ("watchlist_id") REFERENCES "deal_watchlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'deal_portfolio_alerts_property_id_fkey') THEN
    ALTER TABLE "deal_portfolio_alerts" ADD CONSTRAINT "deal_portfolio_alerts_property_id_fkey"
      FOREIGN KEY ("property_id") REFERENCES "fsbo_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "seller_pricing_advice" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "price_position" TEXT NOT NULL,
    "confidence_level" TEXT NOT NULL,
    "suggested_action" TEXT NOT NULL,
    "reasons" JSONB NOT NULL DEFAULT '[]',
    "improvement_actions" JSONB NOT NULL DEFAULT '[]',
    "explanation" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seller_pricing_advice_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "seller_pricing_advice_property_id_key" ON "seller_pricing_advice"("property_id");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'seller_pricing_advice_property_id_fkey') THEN
    ALTER TABLE "seller_pricing_advice" ADD CONSTRAINT "seller_pricing_advice_property_id_fkey"
      FOREIGN KEY ("property_id") REFERENCES "fsbo_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
