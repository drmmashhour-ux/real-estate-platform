-- Dynamic market pricing (distinct from legacy listing `PricingRule`)

CREATE TABLE "lecipm_market_pricing_rules" (
    "id" TEXT NOT NULL,
    "type" VARCHAR(24) NOT NULL,
    "base_price" DOUBLE PRECISION NOT NULL,
    "min_price" DOUBLE PRECISION NOT NULL,
    "max_price" DOUBLE PRECISION NOT NULL,
    "demand_factor" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "quality_factor" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "factor_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lecipm_market_pricing_rules_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "lecipm_market_pricing_rules_type_key" ON "lecipm_market_pricing_rules"("type");

CREATE TABLE "lecipm_pricing_events" (
    "id" TEXT NOT NULL,
    "type" VARCHAR(24) NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "context" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lecipm_pricing_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lecipm_pricing_events_type_created_at_idx" ON "lecipm_pricing_events"("type", "created_at");
