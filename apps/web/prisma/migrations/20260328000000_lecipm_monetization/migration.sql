-- CreateEnum
CREATE TYPE "lead_marketplace_status" AS ENUM ('available', 'reserved', 'sold', 'withdrawn');

-- CreateTable
CREATE TABLE "leads_marketplace" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "fsbo_listing_id" TEXT,
    "score" INTEGER NOT NULL,
    "price_cents" INTEGER NOT NULL,
    "status" "lead_marketplace_status" NOT NULL DEFAULT 'available',
    "buyer_id" TEXT,
    "purchased_at" TIMESTAMPTZ(6),
    "stripe_session_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "leads_marketplace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "broker_lecipm_subscriptions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "plan_slug" TEXT NOT NULL,
    "stripe_subscription_id" TEXT,
    "stripe_customer_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "current_period_end" TIMESTAMPTZ(6),
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "broker_lecipm_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public_share_links" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "resource_key" TEXT NOT NULL,
    "creator_user_id" TEXT,
    "title" TEXT,
    "summary_line" TEXT,
    "trust_score_hint" INTEGER,
    "deal_score_hint" INTEGER,
    "click_count" INTEGER NOT NULL DEFAULT 0,
    "conversion_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "public_share_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "share_click_events" (
    "id" TEXT NOT NULL,
    "share_link_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "share_click_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "leads_marketplace_lead_id_key" ON "leads_marketplace"("lead_id");

-- CreateIndex
CREATE UNIQUE INDEX "leads_marketplace_stripe_session_id_key" ON "leads_marketplace"("stripe_session_id");

-- CreateIndex
CREATE INDEX "leads_marketplace_status_idx" ON "leads_marketplace"("status");

-- CreateIndex
CREATE INDEX "leads_marketplace_score_idx" ON "leads_marketplace"("score");

-- CreateIndex
CREATE INDEX "leads_marketplace_buyer_id_idx" ON "leads_marketplace"("buyer_id");

-- CreateIndex
CREATE UNIQUE INDEX "broker_lecipm_subscriptions_user_id_key" ON "broker_lecipm_subscriptions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "broker_lecipm_subscriptions_stripe_subscription_id_key" ON "broker_lecipm_subscriptions"("stripe_subscription_id");

-- CreateIndex
CREATE INDEX "broker_lecipm_subscriptions_plan_slug_idx" ON "broker_lecipm_subscriptions"("plan_slug");

-- CreateIndex
CREATE INDEX "broker_lecipm_subscriptions_status_idx" ON "broker_lecipm_subscriptions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "public_share_links_token_key" ON "public_share_links"("token");

-- CreateIndex
CREATE INDEX "public_share_links_resource_type_resource_key_idx" ON "public_share_links"("resource_type", "resource_key");

-- CreateIndex
CREATE INDEX "share_click_events_share_link_id_idx" ON "share_click_events"("share_link_id");

-- CreateIndex
CREATE INDEX "share_click_events_created_at_idx" ON "share_click_events"("created_at");

-- AddForeignKey
ALTER TABLE "leads_marketplace" ADD CONSTRAINT "leads_marketplace_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads_marketplace" ADD CONSTRAINT "leads_marketplace_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broker_lecipm_subscriptions" ADD CONSTRAINT "broker_lecipm_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public_share_links" ADD CONSTRAINT "public_share_links_creator_user_id_fkey" FOREIGN KEY ("creator_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "share_click_events" ADD CONSTRAINT "share_click_events_share_link_id_fkey" FOREIGN KEY ("share_link_id") REFERENCES "public_share_links"("id") ON DELETE CASCADE ON UPDATE CASCADE;
