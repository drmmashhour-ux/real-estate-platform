-- BNHub: canonical money breakdown on Payment, orchestrated payout extensions, manual queue, Connect snapshot.

ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "money_breakdown_json" JSONB;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "paid_at" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "payments_stripePaymentId_idx" ON "payments"("stripePaymentId");
CREATE INDEX IF NOT EXISTS "payments_status_idx" ON "payments"("status");

ALTER TABLE "orchestrated_payouts" ADD COLUMN IF NOT EXISTS "payout_method" TEXT NOT NULL DEFAULT 'stripe_connect';
ALTER TABLE "orchestrated_payouts" ADD COLUMN IF NOT EXISTS "failure_reason" TEXT;
ALTER TABLE "orchestrated_payouts" ADD COLUMN IF NOT EXISTS "available_at" TIMESTAMP(3);
ALTER TABLE "orchestrated_payouts" ADD COLUMN IF NOT EXISTS "paid_at" TIMESTAMP(3);
ALTER TABLE "orchestrated_payouts" ADD COLUMN IF NOT EXISTS "stripe_payout_id" TEXT;

CREATE INDEX IF NOT EXISTS "orchestrated_payouts_booking_id_idx" ON "orchestrated_payouts"("booking_id");
CREATE INDEX IF NOT EXISTS "orchestrated_payouts_provider_ref_idx" ON "orchestrated_payouts"("provider_ref");

CREATE TABLE IF NOT EXISTS "bnhub_manual_host_payouts" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "host_user_id" TEXT NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'cad',
    "status" TEXT NOT NULL,
    "queue_reason" TEXT,
    "beneficiary_name" TEXT,
    "contact_phone" TEXT,
    "contact_email" TEXT,
    "reference_note" TEXT,
    "processed_by_user_id" TEXT,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bnhub_manual_host_payouts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "bnhub_manual_host_payouts_booking_id_key" ON "bnhub_manual_host_payouts"("booking_id");
CREATE INDEX IF NOT EXISTS "bnhub_manual_host_payouts_host_user_id_idx" ON "bnhub_manual_host_payouts"("host_user_id");
CREATE INDEX IF NOT EXISTS "bnhub_manual_host_payouts_status_idx" ON "bnhub_manual_host_payouts"("status");

ALTER TABLE "bnhub_manual_host_payouts" DROP CONSTRAINT IF EXISTS "bnhub_manual_host_payouts_booking_id_fkey";
ALTER TABLE "bnhub_manual_host_payouts" ADD CONSTRAINT "bnhub_manual_host_payouts_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bnhub_manual_host_payouts" DROP CONSTRAINT IF EXISTS "bnhub_manual_host_payouts_host_user_id_fkey";
ALTER TABLE "bnhub_manual_host_payouts" ADD CONSTRAINT "bnhub_manual_host_payouts_host_user_id_fkey" FOREIGN KEY ("host_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "host_stripe_account_snapshots" (
    "id" TEXT NOT NULL,
    "host_user_id" TEXT NOT NULL,
    "stripe_account_id" TEXT NOT NULL,
    "charges_enabled" BOOLEAN NOT NULL DEFAULT false,
    "payouts_enabled" BOOLEAN NOT NULL DEFAULT false,
    "details_submitted" BOOLEAN NOT NULL DEFAULT false,
    "onboarding_complete" BOOLEAN NOT NULL DEFAULT false,
    "raw_requirements_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "host_stripe_account_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "host_stripe_account_snapshots_host_user_id_key" ON "host_stripe_account_snapshots"("host_user_id");
CREATE INDEX IF NOT EXISTS "host_stripe_account_snapshots_stripe_account_id_idx" ON "host_stripe_account_snapshots"("stripe_account_id");

ALTER TABLE "host_stripe_account_snapshots" DROP CONSTRAINT IF EXISTS "host_stripe_account_snapshots_host_user_id_fkey";
ALTER TABLE "host_stripe_account_snapshots" ADD CONSTRAINT "host_stripe_account_snapshots_host_user_id_fkey" FOREIGN KEY ("host_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
