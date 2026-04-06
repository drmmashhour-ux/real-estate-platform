-- LECIPM broker assigned-lead billing (BrokerLead, BrokerInvoice, BrokerPayment, BrokerMonetizationProfile)

CREATE TABLE "broker_monetization_profiles" (
    "broker_id" TEXT NOT NULL,
    "lead_price" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "checkout_mode" TEXT NOT NULL DEFAULT 'invoice_batch',
    "max_unpaid_leads" INTEGER NOT NULL DEFAULT 5,
    "lead_receiving_paused" BOOLEAN NOT NULL DEFAULT false,
    "subscription_covers_assigned_leads" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "broker_monetization_profiles_pkey" PRIMARY KEY ("broker_id")
);

CREATE TABLE "broker_invoices" (
    "id" TEXT NOT NULL,
    "broker_id" TEXT NOT NULL,
    "total_amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "stripe_session_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "broker_invoices_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "broker_leads" (
    "id" TEXT NOT NULL,
    "broker_id" TEXT NOT NULL,
    "buyer_id" TEXT,
    "listing_id" TEXT,
    "lead_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "billing_status" TEXT NOT NULL DEFAULT 'unpaid',
    "price" DOUBLE PRECISION NOT NULL,
    "broker_invoice_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "broker_leads_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "broker_payments" (
    "id" TEXT NOT NULL,
    "broker_id" TEXT NOT NULL,
    "stripe_payment_intent_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "broker_lead_id" TEXT,
    "broker_invoice_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "broker_payments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "broker_leads_lead_id_key" ON "broker_leads"("lead_id");

CREATE UNIQUE INDEX "broker_invoices_stripe_session_id_key" ON "broker_invoices"("stripe_session_id");

CREATE UNIQUE INDEX "broker_payments_stripe_payment_intent_id_key" ON "broker_payments"("stripe_payment_intent_id");

CREATE INDEX "broker_leads_broker_id_idx" ON "broker_leads"("broker_id");

CREATE INDEX "broker_leads_broker_id_billing_status_idx" ON "broker_leads"("broker_id", "billing_status");

CREATE INDEX "broker_leads_broker_invoice_id_idx" ON "broker_leads"("broker_invoice_id");

CREATE INDEX "broker_invoices_broker_id_idx" ON "broker_invoices"("broker_id");

CREATE INDEX "broker_invoices_status_idx" ON "broker_invoices"("status");

CREATE INDEX "broker_payments_broker_id_idx" ON "broker_payments"("broker_id");

CREATE INDEX "broker_payments_broker_invoice_id_idx" ON "broker_payments"("broker_invoice_id");

ALTER TABLE "broker_monetization_profiles" ADD CONSTRAINT "broker_monetization_profiles_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "broker_invoices" ADD CONSTRAINT "broker_invoices_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "broker_leads" ADD CONSTRAINT "broker_leads_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "broker_leads" ADD CONSTRAINT "broker_leads_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "broker_leads" ADD CONSTRAINT "broker_leads_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "broker_leads" ADD CONSTRAINT "broker_leads_broker_invoice_id_fkey" FOREIGN KEY ("broker_invoice_id") REFERENCES "broker_invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "broker_payments" ADD CONSTRAINT "broker_payments_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "broker_payments" ADD CONSTRAINT "broker_payments_broker_lead_id_fkey" FOREIGN KEY ("broker_lead_id") REFERENCES "broker_leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "broker_payments" ADD CONSTRAINT "broker_payments_broker_invoice_id_fkey" FOREIGN KEY ("broker_invoice_id") REFERENCES "broker_invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
