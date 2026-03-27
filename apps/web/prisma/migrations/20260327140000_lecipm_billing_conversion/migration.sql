-- LECIPM billing conversion: plans, subscriptions, usage, entitlements
CREATE TYPE "lecipm_conversion_subscription_status" AS ENUM (
  'trial', 'active', 'past_due', 'canceled', 'incomplete', 'expired'
);

CREATE TABLE "lecipm_conversion_plans" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price_monthly_cents" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "features" JSONB NOT NULL DEFAULT '{}',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "lecipm_conversion_plans_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "lecipm_conversion_plans_code_key" ON "lecipm_conversion_plans"("code");

CREATE TABLE "lecipm_conversion_subscriptions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'stripe',
    "provider_customer_id" TEXT,
    "provider_subscription_id" TEXT,
    "status" "lecipm_conversion_subscription_status" NOT NULL,
    "current_period_start" TIMESTAMPTZ(6),
    "current_period_end" TIMESTAMPTZ(6),
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "lecipm_conversion_subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "lecipm_conversion_subscriptions_user_id_key" ON "lecipm_conversion_subscriptions"("user_id");
CREATE UNIQUE INDEX "lecipm_conversion_subscriptions_provider_subscription_id_key" ON "lecipm_conversion_subscriptions"("provider_subscription_id");
CREATE INDEX "idx_lecipm_conv_sub_status" ON "lecipm_conversion_subscriptions"("status");

ALTER TABLE "lecipm_conversion_subscriptions" ADD CONSTRAINT "lecipm_conversion_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lecipm_conversion_subscriptions" ADD CONSTRAINT "lecipm_conversion_subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "lecipm_conversion_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "lecipm_conversion_usage" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "period_key" TEXT NOT NULL,
    "simulations_used" INTEGER NOT NULL DEFAULT 0,
    "drafts_used" INTEGER NOT NULL DEFAULT 0,
    "negotiation_drafts_used" INTEGER NOT NULL DEFAULT 0,
    "scenario_saves_used" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "lecipm_conversion_usage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uq_lecipm_conv_usage_user_period" ON "lecipm_conversion_usage"("user_id", "period_key");
CREATE INDEX "idx_lecipm_conv_usage_user" ON "lecipm_conversion_usage"("user_id");

ALTER TABLE "lecipm_conversion_usage" ADD CONSTRAINT "lecipm_conversion_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "lecipm_conversion_entitlements" (
    "id" TEXT NOT NULL,
    "plan_code" TEXT NOT NULL,
    "feature_key" TEXT NOT NULL,
    "limit_value" INTEGER,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "lecipm_conversion_entitlements_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uq_lecipm_conv_ent_plan_feature" ON "lecipm_conversion_entitlements"("plan_code", "feature_key");
CREATE INDEX "idx_lecipm_conv_ent_plan" ON "lecipm_conversion_entitlements"("plan_code");

-- Seed plans (ids are stable cuid-like placeholders — Prisma will use cuid() at runtime for new rows; seed uses fixed ids for FK)
INSERT INTO "lecipm_conversion_plans" ("id", "code", "name", "price_monthly_cents", "currency", "features", "active", "created_at", "updated_at")
VALUES
  ('lcplan_free', 'free', 'Free', NULL, 'USD', '{}', true, NOW(), NOW()),
  ('lcplan_pro', 'pro', 'Pro', 9900, 'USD', '{"tier":"pro"}', true, NOW(), NOW()),
  ('lcplan_team', 'team', 'Team', 29900, 'USD', '{"tier":"team"}', true, NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;

-- Entitlements: limit_value NULL = unlimited count; enabled false = locked for plan
INSERT INTO "lecipm_conversion_entitlements" ("id", "plan_code", "feature_key", "limit_value", "enabled", "created_at", "updated_at") VALUES
  ('ent_free_sim', 'free', 'simulations', 3, true, NOW(), NOW()),
  ('ent_free_ai', 'free', 'ai_drafting', 2, true, NOW(), NOW()),
  ('ent_free_neg', 'free', 'negotiation_drafts', 2, true, NOW(), NOW()),
  ('ent_free_hist', 'free', 'scenario_history', 3, true, NOW(), NOW()),
  ('ent_free_pre', 'free', 'presentation_mode', 0, false, NOW(), NOW()),
  ('ent_free_cc', 'free', 'advanced_command_center', 0, false, NOW(), NOW()),
  ('ent_free_legal', 'free', 'legal_assistant', 0, false, NOW(), NOW()),
  ('ent_free_watch', 'free', 'watchlist_alerts', 0, false, NOW(), NOW()),
  ('ent_free_deal', 'free', 'daily_deal_feed', 0, false, NOW(), NOW()),
  ('ent_pro_sim', 'pro', 'simulations', NULL, true, NOW(), NOW()),
  ('ent_pro_ai', 'pro', 'ai_drafting', NULL, true, NOW(), NOW()),
  ('ent_pro_neg', 'pro', 'negotiation_drafts', NULL, true, NOW(), NOW()),
  ('ent_pro_hist', 'pro', 'scenario_history', NULL, true, NOW(), NOW()),
  ('ent_pro_pre', 'pro', 'presentation_mode', NULL, true, NOW(), NOW()),
  ('ent_pro_cc', 'pro', 'advanced_command_center', NULL, true, NOW(), NOW()),
  ('ent_pro_legal', 'pro', 'legal_assistant', NULL, true, NOW(), NOW()),
  ('ent_pro_watch', 'pro', 'watchlist_alerts', NULL, true, NOW(), NOW()),
  ('ent_pro_deal', 'pro', 'daily_deal_feed', NULL, true, NOW(), NOW()),
  ('ent_team_sim', 'team', 'simulations', NULL, true, NOW(), NOW()),
  ('ent_team_ai', 'team', 'ai_drafting', NULL, true, NOW(), NOW()),
  ('ent_team_neg', 'team', 'negotiation_drafts', NULL, true, NOW(), NOW()),
  ('ent_team_hist', 'team', 'scenario_history', NULL, true, NOW(), NOW()),
  ('ent_team_pre', 'team', 'presentation_mode', NULL, true, NOW(), NOW()),
  ('ent_team_cc', 'team', 'advanced_command_center', NULL, true, NOW(), NOW()),
  ('ent_team_legal', 'team', 'legal_assistant', NULL, true, NOW(), NOW()),
  ('ent_team_watch', 'team', 'watchlist_alerts', NULL, true, NOW(), NOW()),
  ('ent_team_deal', 'team', 'daily_deal_feed', NULL, true, NOW(), NOW())
ON CONFLICT ("plan_code", "feature_key") DO NOTHING;
