-- Multi-provider orchestration tables (Stripe + Clover). BNHub `payments` unchanged.

CREATE TABLE "orchestrated_payments" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_payment_id" TEXT,
    "user_id" TEXT NOT NULL,
    "booking_id" TEXT,
    "payment_type" TEXT NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'cad',
    "platform_fee_cents" INTEGER NOT NULL,
    "host_amount_cents" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "checkout_session_url" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orchestrated_payments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "orchestrated_payments_user_id_idx" ON "orchestrated_payments"("user_id");
CREATE INDEX "orchestrated_payments_booking_id_idx" ON "orchestrated_payments"("booking_id");
CREATE INDEX "orchestrated_payments_provider_idx" ON "orchestrated_payments"("provider");
CREATE INDEX "orchestrated_payments_status_idx" ON "orchestrated_payments"("status");
CREATE INDEX "orchestrated_payments_created_at_idx" ON "orchestrated_payments"("created_at");

ALTER TABLE "orchestrated_payments" ADD CONSTRAINT "orchestrated_payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "orchestrated_payments" ADD CONSTRAINT "orchestrated_payments_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "orchestrated_payouts" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_ref" TEXT,
    "host_id" TEXT NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'cad',
    "status" TEXT NOT NULL,
    "scheduled_at" TIMESTAMP(3),
    "booking_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orchestrated_payouts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "orchestrated_payouts_host_id_idx" ON "orchestrated_payouts"("host_id");
CREATE INDEX "orchestrated_payouts_status_idx" ON "orchestrated_payouts"("status");
CREATE INDEX "orchestrated_payouts_scheduled_at_idx" ON "orchestrated_payouts"("scheduled_at");

ALTER TABLE "orchestrated_payouts" ADD CONSTRAINT "orchestrated_payouts_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
