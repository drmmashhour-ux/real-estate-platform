-- Revenue optimization: lead value, tiers, dynamic pricing hooks, expert upsell flags

ALTER TABLE "mortgage_experts" ADD COLUMN IF NOT EXISTS "revenue_premium_listing" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "mortgage_experts" ADD COLUMN IF NOT EXISTS "revenue_featured_expert" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "mortgage_experts" ADD COLUMN IF NOT EXISTS "revenue_premium_placement" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "estimated_value" INTEGER;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "conversion_probability" DOUBLE PRECISION;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "value_source" TEXT;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "revenue_tier" TEXT;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "mortgage_credit_cost" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "dynamic_lead_price_cents" INTEGER;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "service_commission_rate" DOUBLE PRECISION;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "mortgage_assigned_at" TIMESTAMP(3);
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "mortgage_sla_reminder_at" TIMESTAMP(3);
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "revenue_ab_variant" TEXT;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "purchase_region" TEXT;

CREATE INDEX IF NOT EXISTS "Lead_revenue_tier_idx" ON "Lead"("revenue_tier");
CREATE INDEX IF NOT EXISTS "Lead_purchase_region_idx" ON "Lead"("purchase_region");
