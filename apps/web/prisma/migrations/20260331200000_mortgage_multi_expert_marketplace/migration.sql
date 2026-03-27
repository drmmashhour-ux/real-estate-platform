-- Multi-expert marketplace: caps, credits, subscriptions, reviews, marketplace leads

ALTER TABLE "mortgage_experts" ADD COLUMN IF NOT EXISTS "is_available" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "mortgage_experts" ADD COLUMN IF NOT EXISTS "max_leads_per_day" INTEGER NOT NULL DEFAULT 10;
ALTER TABLE "mortgage_experts" ADD COLUMN IF NOT EXISTS "current_leads_today" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "mortgage_experts" ADD COLUMN IF NOT EXISTS "rating" DOUBLE PRECISION NOT NULL DEFAULT 5;
ALTER TABLE "mortgage_experts" ADD COLUMN IF NOT EXISTS "review_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "mortgage_experts" ADD COLUMN IF NOT EXISTS "total_deals" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "mortgage_experts" ADD COLUMN IF NOT EXISTS "total_revenue" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "mortgage_experts" ADD COLUMN IF NOT EXISTS "admin_rating_boost" DOUBLE PRECISION NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS "mortgage_experts_is_available_idx" ON "mortgage_experts"("is_available");
CREATE INDEX IF NOT EXISTS "mortgage_experts_current_leads_today_idx" ON "mortgage_experts"("current_leads_today");

CREATE TABLE IF NOT EXISTS "expert_subscriptions" (
    "id" TEXT NOT NULL,
    "expert_id" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'basic',
    "price" INTEGER NOT NULL DEFAULT 0,
    "max_leads_per_day" INTEGER NOT NULL DEFAULT 5,
    "priority_weight" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expert_subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "expert_subscriptions_expert_id_key" ON "expert_subscriptions"("expert_id");
CREATE INDEX IF NOT EXISTS "expert_subscriptions_plan_idx" ON "expert_subscriptions"("plan");

ALTER TABLE "expert_subscriptions" DROP CONSTRAINT IF EXISTS "expert_subscriptions_expert_id_fkey";
ALTER TABLE "expert_subscriptions" ADD CONSTRAINT "expert_subscriptions_expert_id_fkey" FOREIGN KEY ("expert_id") REFERENCES "mortgage_experts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "expert_subscriptions" ("id", "expert_id", "plan", "price", "max_leads_per_day", "priority_weight", "is_active", "created_at", "updated_at")
SELECT 'mortgage_sub_' || me."id", me."id", 'basic', 0, 5, 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "mortgage_experts" me
WHERE NOT EXISTS (SELECT 1 FROM "expert_subscriptions" s WHERE s."expert_id" = me."id");

CREATE TABLE IF NOT EXISTS "expert_credits" (
    "expert_id" TEXT NOT NULL,
    "credits" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expert_credits_pkey" PRIMARY KEY ("expert_id")
);

ALTER TABLE "expert_credits" DROP CONSTRAINT IF EXISTS "expert_credits_expert_id_fkey";
ALTER TABLE "expert_credits" ADD CONSTRAINT "expert_credits_expert_id_fkey" FOREIGN KEY ("expert_id") REFERENCES "mortgage_experts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "mortgage_expert_reviews" (
    "id" TEXT NOT NULL,
    "expert_id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "reviewer_email" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mortgage_expert_reviews_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "mortgage_expert_reviews_lead_id_key" ON "mortgage_expert_reviews"("lead_id");
CREATE INDEX IF NOT EXISTS "mortgage_expert_reviews_expert_id_idx" ON "mortgage_expert_reviews"("expert_id");

ALTER TABLE "mortgage_expert_reviews" DROP CONSTRAINT IF EXISTS "mortgage_expert_reviews_expert_id_fkey";
ALTER TABLE "mortgage_expert_reviews" ADD CONSTRAINT "mortgage_expert_reviews_expert_id_fkey" FOREIGN KEY ("expert_id") REFERENCES "mortgage_experts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "mortgage_expert_reviews" DROP CONSTRAINT IF EXISTS "mortgage_expert_reviews_lead_id_fkey";
ALTER TABLE "mortgage_expert_reviews" ADD CONSTRAINT "mortgage_expert_reviews_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "mortgage_deals" ADD COLUMN IF NOT EXISTS "review_token" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "mortgage_deals_review_token_key" ON "mortgage_deals"("review_token");

ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "mortgage_marketplace_status" TEXT;
CREATE INDEX IF NOT EXISTS "Lead_mortgage_marketplace_status_idx" ON "Lead"("mortgage_marketplace_status");
