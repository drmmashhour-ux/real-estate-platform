-- Mortgage expert Stripe billing, invoices, payout tracking, monthly lead caps

ALTER TABLE "expert_subscriptions" ADD COLUMN IF NOT EXISTS "max_leads_per_month" INTEGER NOT NULL DEFAULT 10;

CREATE TABLE IF NOT EXISTS "expert_billing" (
    "id" TEXT NOT NULL,
    "expert_id" TEXT NOT NULL,
    "stripe_customer_id" TEXT,
    "stripe_subscription_id" TEXT,
    "plan" TEXT NOT NULL DEFAULT 'basic',
    "status" TEXT NOT NULL DEFAULT 'active',
    "current_period_end" TIMESTAMP(3),
    "leads_assigned_this_month" INTEGER NOT NULL DEFAULT 0,
    "usage_month_utc" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expert_billing_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "expert_billing_expert_id_key" ON "expert_billing"("expert_id");
CREATE INDEX IF NOT EXISTS "expert_billing_stripe_subscription_id_idx" ON "expert_billing"("stripe_subscription_id");
CREATE INDEX IF NOT EXISTS "expert_billing_stripe_customer_id_idx" ON "expert_billing"("stripe_customer_id");

ALTER TABLE "expert_billing" DROP CONSTRAINT IF EXISTS "expert_billing_expert_id_fkey";
ALTER TABLE "expert_billing" ADD CONSTRAINT "expert_billing_expert_id_fkey" FOREIGN KEY ("expert_id") REFERENCES "mortgage_experts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "expert_invoices" (
    "id" TEXT NOT NULL,
    "expert_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'cad',
    "stripe_invoice_id" TEXT,
    "stripe_payment_intent_id" TEXT,
    "stripe_checkout_session_id" TEXT,
    "description" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expert_invoices_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "expert_invoices_expert_id_created_at_idx" ON "expert_invoices"("expert_id", "created_at");

ALTER TABLE "expert_invoices" DROP CONSTRAINT IF EXISTS "expert_invoices_expert_id_fkey";
ALTER TABLE "expert_invoices" ADD CONSTRAINT "expert_invoices_expert_id_fkey" FOREIGN KEY ("expert_id") REFERENCES "mortgage_experts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "expert_payout_records" (
    "id" TEXT NOT NULL,
    "expert_id" TEXT NOT NULL,
    "mortgage_deal_id" TEXT,
    "expert_amount_cents" INTEGER NOT NULL,
    "platform_fee_cents" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "stripe_transfer_id" TEXT,
    "failure_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expert_payout_records_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "expert_payout_records_mortgage_deal_id_key" ON "expert_payout_records"("mortgage_deal_id");
CREATE INDEX IF NOT EXISTS "expert_payout_records_expert_id_idx" ON "expert_payout_records"("expert_id");
CREATE INDEX IF NOT EXISTS "expert_payout_records_status_idx" ON "expert_payout_records"("status");

ALTER TABLE "expert_payout_records" DROP CONSTRAINT IF EXISTS "expert_payout_records_expert_id_fkey";
ALTER TABLE "expert_payout_records" ADD CONSTRAINT "expert_payout_records_expert_id_fkey" FOREIGN KEY ("expert_id") REFERENCES "mortgage_experts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
