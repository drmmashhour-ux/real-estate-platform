-- Lead credits for broker pay-per-lead (credit redemption path).
ALTER TABLE "broker_monetization_profiles" ADD COLUMN IF NOT EXISTS "lead_credits_balance" INTEGER NOT NULL DEFAULT 0;

-- Public pricing tiers (Free / Pro / Platinum).
CREATE TABLE IF NOT EXISTS "monetization_plan_tiers" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price_cents_monthly" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'cad',
    "storage_bytes_hint" BIGINT,
    "features" JSONB,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monetization_plan_tiers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "monetization_plan_tiers_slug_key" ON "monetization_plan_tiers"("slug");
CREATE INDEX IF NOT EXISTS "monetization_plan_tiers_active_sort_order_idx" ON "monetization_plan_tiers"("active", "sort_order");

INSERT INTO "monetization_plan_tiers" ("id", "slug", "name", "description", "price_cents_monthly", "currency", "storage_bytes_hint", "features", "sort_order", "active", "created_at", "updated_at")
SELECT 'cm_monetization_tier_free', 'free', 'Free', 'Core browsing, saved listings, and starter workflows.', 0, 'cad', 524288000, '{"storageLabel":"500MB","highlights":["Browse marketplace","BNHub discovery","Basic CRM visibility"]}'::jsonb, 0, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "monetization_plan_tiers" WHERE "slug" = 'free');

INSERT INTO "monetization_plan_tiers" ("id", "slug", "name", "description", "price_cents_monthly", "currency", "storage_bytes_hint", "features", "sort_order", "active", "created_at", "updated_at")
SELECT 'cm_monetization_tier_pro', 'pro', 'Pro', 'More storage, deeper AI insight, and broker productivity tools.', 500, 'cad', 5368709120, '{"storageLabel":"5GB","highlights":["Deal analyzer depth","Priority support queue","Lead batch checkout"]}'::jsonb, 1, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "monetization_plan_tiers" WHERE "slug" = 'pro');

INSERT INTO "monetization_plan_tiers" ("id", "slug", "name", "description", "price_cents_monthly", "currency", "storage_bytes_hint", "features", "sort_order", "active", "created_at", "updated_at")
SELECT 'cm_monetization_tier_platinum', 'platinum', 'Platinum', 'Maximum storage, advanced automation, and growth analytics.', 1500, 'cad', 53687091200, '{"storageLabel":"50GB","highlights":["Workspace scale","Revenue dashboards","API-ready exports"]}'::jsonb, 2, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "monetization_plan_tiers" WHERE "slug" = 'platinum');
