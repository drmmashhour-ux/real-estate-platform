-- LECIPM Monetization System v1 — pricing catalog, subscription rows, transaction log, revenue attribution

CREATE TABLE "lecipm_pricing_plan_catalog" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "host_fee_percent" DOUBLE PRECISION,
    "guest_fee_percent" DOUBLE PRECISION,
    "lead_fee" DOUBLE PRECISION,
    "success_fee_percent" DOUBLE PRECISION,
    "subscription_price" DOUBLE PRECISION,
    "features" JSONB NOT NULL DEFAULT '{}',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lecipm_pricing_plan_catalog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lecipm_pricing_plan_catalog_type_active_idx" ON "lecipm_pricing_plan_catalog"("type", "active");

CREATE TABLE "lecipm_monetization_subscriptions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "stripe_customer_id" TEXT,
    "stripe_subscription_id" TEXT,
    "status" TEXT NOT NULL,
    "current_period_end" TIMESTAMPTZ(6),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lecipm_monetization_subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "lecipm_monetization_subscriptions_stripe_subscription_id_key" ON "lecipm_monetization_subscriptions"("stripe_subscription_id");

CREATE INDEX "lecipm_monetization_subscriptions_user_id_idx" ON "lecipm_monetization_subscriptions"("user_id");

CREATE INDEX "lecipm_monetization_subscriptions_status_idx" ON "lecipm_monetization_subscriptions"("status");

ALTER TABLE "lecipm_monetization_subscriptions" ADD CONSTRAINT "lecipm_monetization_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lecipm_monetization_subscriptions" ADD CONSTRAINT "lecipm_monetization_subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "lecipm_pricing_plan_catalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "lecipm_monetization_transactions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'CAD',
    "status" TEXT NOT NULL,
    "stripe_payment_intent_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lecipm_monetization_transactions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "lecipm_monetization_transactions_stripe_payment_intent_id_key" ON "lecipm_monetization_transactions"("stripe_payment_intent_id");

CREATE INDEX "lecipm_monetization_transactions_user_id_created_at_idx" ON "lecipm_monetization_transactions"("user_id", "created_at");

CREATE INDEX "lecipm_monetization_transactions_type_status_idx" ON "lecipm_monetization_transactions"("type", "status");

ALTER TABLE "lecipm_monetization_transactions" ADD CONSTRAINT "lecipm_monetization_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "lecipm_revenue_attribution_events" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "category" TEXT NOT NULL,
    "reference_id" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'CAD',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lecipm_revenue_attribution_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lecipm_revenue_attribution_events_source_category_idx" ON "lecipm_revenue_attribution_events"("source", "category");

CREATE INDEX "lecipm_revenue_attribution_events_created_at_idx" ON "lecipm_revenue_attribution_events"("created_at");
