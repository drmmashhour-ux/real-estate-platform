-- Broker tiers + analytics for mortgage lead monetization
ALTER TABLE "mortgage_brokers" ADD COLUMN "plan" TEXT NOT NULL DEFAULT 'free';
ALTER TABLE "mortgage_brokers" ADD COLUMN "leads_viewed_total" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "mortgage_brokers" ADD COLUMN "upgrade_click_count" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX "mortgage_brokers_plan_idx" ON "mortgage_brokers"("plan");
