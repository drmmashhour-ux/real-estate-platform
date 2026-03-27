-- LECIPM: Stripe `subscriptions` + `billing_events` + Copilot persistence (replaces `stripe_subscriptions` / `copilot_memory_chunks`).

DROP TABLE IF EXISTS "stripe_subscriptions" CASCADE;
DROP TABLE IF EXISTS "copilot_memory_chunks" CASCADE;

DO $$ BEGIN
  CREATE TYPE "subscription_status" AS ENUM (
    'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'incomplete', 'incomplete_expired', 'paused'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "billing_event_type" AS ENUM (
    'checkout_completed', 'subscription_created', 'subscription_updated', 'subscription_deleted',
    'invoice_payment_failed', 'invoice_paid'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "copilot_message_role" AS ENUM ('user', 'assistant', 'system', 'tool');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "copilot_intent" AS ENUM (
    'find_deals', 'analyze_property', 'improve_listing', 'why_not_selling',
    'portfolio_summary', 'pricing_help', 'risk_check', 'unknown'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "copilot_run_status" AS ENUM ('queued', 'completed', 'failed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "subscriptions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "workspace_id" UUID,
  "user_id" TEXT,
  "stripe_customer_id" TEXT,
  "stripe_subscription_id" TEXT,
  "stripe_price_id" TEXT,
  "plan_code" TEXT NOT NULL,
  "status" "subscription_status" NOT NULL,
  "current_period_start" TIMESTAMPTZ(6),
  "current_period_end" TIMESTAMPTZ(6),
  "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
  "metadata" JSONB,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_stripe_subscription_id_key" ON "subscriptions"("stripe_subscription_id");

CREATE INDEX IF NOT EXISTS "idx_subscriptions_workspace_id" ON "subscriptions"("workspace_id");
CREATE INDEX IF NOT EXISTS "idx_subscriptions_user_id" ON "subscriptions"("user_id");
CREATE INDEX IF NOT EXISTS "idx_subscriptions_status" ON "subscriptions"("status");
CREATE INDEX IF NOT EXISTS "idx_subscriptions_plan_code" ON "subscriptions"("plan_code");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_user_id_fkey'
  ) THEN
    ALTER TABLE "subscriptions"
      ADD CONSTRAINT "subscriptions_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "billing_events" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "subscription_id" UUID,
  "workspace_id" UUID,
  "user_id" TEXT,
  "event_type" "billing_event_type" NOT NULL,
  "stripe_event_id" TEXT,
  "payload" JSONB,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "billing_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "billing_events_stripe_event_id_key" ON "billing_events"("stripe_event_id");
CREATE INDEX IF NOT EXISTS "idx_billing_events_subscription_id" ON "billing_events"("subscription_id");
CREATE INDEX IF NOT EXISTS "idx_billing_events_workspace_id" ON "billing_events"("workspace_id");
CREATE INDEX IF NOT EXISTS "idx_billing_events_user_id" ON "billing_events"("user_id");
CREATE INDEX IF NOT EXISTS "idx_billing_events_event_type" ON "billing_events"("event_type");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'billing_events_subscription_id_fkey'
  ) THEN
    ALTER TABLE "billing_events"
      ADD CONSTRAINT "billing_events_subscription_id_fkey"
      FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "copilot_conversations" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" TEXT NOT NULL,
  "workspace_id" UUID,
  "title" TEXT,
  "last_intent" "copilot_intent",
  "metadata" JSONB,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "copilot_conversations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_copilot_conversations_user_id" ON "copilot_conversations"("user_id");
CREATE INDEX IF NOT EXISTS "idx_copilot_conversations_workspace_id" ON "copilot_conversations"("workspace_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'copilot_conversations_user_id_fkey'
  ) THEN
    ALTER TABLE "copilot_conversations"
      ADD CONSTRAINT "copilot_conversations_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "copilot_messages" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "conversation_id" UUID NOT NULL,
  "role" "copilot_message_role" NOT NULL,
  "content" TEXT NOT NULL,
  "intent" "copilot_intent",
  "metadata" JSONB,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "copilot_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_copilot_messages_conversation_id" ON "copilot_messages"("conversation_id");
CREATE INDEX IF NOT EXISTS "idx_copilot_messages_role" ON "copilot_messages"("role");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'copilot_messages_conversation_id_fkey'
  ) THEN
    ALTER TABLE "copilot_messages"
      ADD CONSTRAINT "copilot_messages_conversation_id_fkey"
      FOREIGN KEY ("conversation_id") REFERENCES "copilot_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "copilot_runs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "conversation_id" UUID NOT NULL,
  "user_id" TEXT NOT NULL,
  "workspace_id" UUID,
  "query" TEXT NOT NULL,
  "intent" "copilot_intent" NOT NULL,
  "status" "copilot_run_status" NOT NULL,
  "confidence" DECIMAL(5,4),
  "summary" TEXT,
  "actions" JSONB,
  "insights" JSONB,
  "warnings" JSONB,
  "data" JSONB,
  "error_message" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completed_at" TIMESTAMPTZ(6),

  CONSTRAINT "copilot_runs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_copilot_runs_conversation_id" ON "copilot_runs"("conversation_id");
CREATE INDEX IF NOT EXISTS "idx_copilot_runs_user_id" ON "copilot_runs"("user_id");
CREATE INDEX IF NOT EXISTS "idx_copilot_runs_workspace_id" ON "copilot_runs"("workspace_id");
CREATE INDEX IF NOT EXISTS "idx_copilot_runs_intent" ON "copilot_runs"("intent");
CREATE INDEX IF NOT EXISTS "idx_copilot_runs_status" ON "copilot_runs"("status");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'copilot_runs_conversation_id_fkey'
  ) THEN
    ALTER TABLE "copilot_runs"
      ADD CONSTRAINT "copilot_runs_conversation_id_fkey"
      FOREIGN KEY ("conversation_id") REFERENCES "copilot_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'copilot_runs_user_id_fkey'
  ) THEN
    ALTER TABLE "copilot_runs"
      ADD CONSTRAINT "copilot_runs_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "copilot_memory_items" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" TEXT NOT NULL,
  "workspace_id" UUID,
  "memory_type" TEXT NOT NULL,
  "key" TEXT,
  "content" TEXT NOT NULL,
  "metadata" JSONB,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "copilot_memory_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_copilot_memory_user_id" ON "copilot_memory_items"("user_id");
CREATE INDEX IF NOT EXISTS "idx_copilot_memory_workspace_id" ON "copilot_memory_items"("workspace_id");
CREATE INDEX IF NOT EXISTS "idx_copilot_memory_type" ON "copilot_memory_items"("memory_type");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'copilot_memory_items_user_id_fkey'
  ) THEN
    ALTER TABLE "copilot_memory_items"
      ADD CONSTRAINT "copilot_memory_items_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION lecipm_set_updated_at_subscriptions() RETURNS TRIGGER AS $$
BEGIN
  NEW."updated_at" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_subscriptions_updated_at ON "subscriptions";
CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON "subscriptions"
  FOR EACH ROW EXECUTE PROCEDURE lecipm_set_updated_at_subscriptions();

DROP TRIGGER IF EXISTS trg_copilot_conversations_updated_at ON "copilot_conversations";
CREATE TRIGGER trg_copilot_conversations_updated_at
  BEFORE UPDATE ON "copilot_conversations"
  FOR EACH ROW EXECUTE PROCEDURE lecipm_set_updated_at_subscriptions();

DROP TRIGGER IF EXISTS trg_copilot_memory_items_updated_at ON "copilot_memory_items";
CREATE TRIGGER trg_copilot_memory_items_updated_at
  BEFORE UPDATE ON "copilot_memory_items"
  FOR EACH ROW EXECUTE PROCEDURE lecipm_set_updated_at_subscriptions();
