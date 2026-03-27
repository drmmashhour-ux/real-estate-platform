-- BNHub marketplace payments & escrow-like payout control (amounts in cents)
-- Run after Prisma validates; adjust if enum types already exist.

CREATE TYPE "BnhubMpAccountRole" AS ENUM ('HOST', 'PLATFORM');
CREATE TYPE "BnhubMpProcessor" AS ENUM ('STRIPE');
CREATE TYPE "BnhubMpOnboardingStatus" AS ENUM ('NOT_STARTED', 'PENDING', 'ACTIVE', 'RESTRICTED', 'REJECTED');
CREATE TYPE "BnhubMpVerificationState" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED', 'RESTRICTED');
CREATE TYPE "BnhubMpReservationPaymentStatus" AS ENUM ('DRAFT', 'REQUIRES_ACTION', 'PROCESSING', 'AUTHORIZED', 'PAID', 'PARTIALLY_REFUNDED', 'REFUNDED', 'FAILED', 'CANCELLED', 'DISPUTED');
CREATE TYPE "BnhubMpCaptureMode" AS ENUM ('AUTOMATIC', 'MANUAL', 'PARTIAL_CAPTURE_READY');
CREATE TYPE "BnhubMpFundsFlow" AS ENUM ('DESTINATION_CHARGE', 'SEPARATE_CHARGE_TRANSFER', 'MANUAL_RELEASE');
CREATE TYPE "BnhubMpRiskHold" AS ENUM ('NONE', 'HELD', 'UNDER_REVIEW', 'RELEASE_BLOCKED');
CREATE TYPE "BnhubMpPayoutStatus" AS ENUM ('PENDING', 'SCHEDULED', 'HELD', 'IN_TRANSIT', 'PAID', 'FAILED', 'REVERSED', 'CANCELLED');
CREATE TYPE "BnhubMpHoldType" AS ENUM ('RISK_HOLD', 'DISPUTE_HOLD', 'PAYOUT_RESERVE', 'SECURITY_HOLD', 'COMPLIANCE_HOLD');
CREATE TYPE "BnhubMpHoldStatus" AS ENUM ('ACTIVE', 'RELEASED', 'EXPIRED', 'CANCELLED');
CREATE TYPE "BnhubMpRefundType" AS ENUM ('FULL', 'PARTIAL', 'CANCELLATION', 'GOODWILL', 'DISPUTE_RESOLUTION');
CREATE TYPE "BnhubMpRefundStatus" AS ENUM ('DRAFT', 'PENDING', 'SUCCEEDED', 'FAILED', 'CANCELLED');
CREATE TYPE "BnhubMpDisputeStatus" AS ENUM ('OPEN', 'WARNING_NEEDS_RESPONSE', 'UNDER_REVIEW', 'WON', 'LOST', 'CLOSED');
CREATE TYPE "BnhubMpPaymentEventActor" AS ENUM ('SYSTEM', 'GUEST', 'HOST', 'ADMIN', 'WEBHOOK');
CREATE TYPE "BnhubMpLedgerEntity" AS ENUM ('PAYMENT', 'PAYOUT', 'REFUND', 'FEE', 'RESERVE', 'ADJUSTMENT');
CREATE TYPE "BnhubMpLedgerDirection" AS ENUM ('DEBIT', 'CREDIT');
CREATE TYPE "BnhubMpWebhookInboxStatus" AS ENUM ('RECEIVED', 'PROCESSED', 'FAILED', 'IGNORED');

CREATE TABLE "bnhub_payment_accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role_type" "BnhubMpAccountRole" NOT NULL,
    "processor" "BnhubMpProcessor" NOT NULL,
    "processor_account_id" TEXT NOT NULL,
    "onboarding_status" "BnhubMpOnboardingStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "payouts_enabled" BOOLEAN NOT NULL DEFAULT false,
    "charges_enabled" BOOLEAN NOT NULL DEFAULT false,
    "requirements_json" JSONB NOT NULL DEFAULT '{}',
    "verification_status" "BnhubMpVerificationState" NOT NULL DEFAULT 'UNVERIFIED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "bnhub_payment_accounts_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "bnhub_payment_accounts_user_processor_role_key" ON "bnhub_payment_accounts" ("user_id", "processor", "role_type");
CREATE INDEX "bnhub_payment_accounts_user_id_idx" ON "bnhub_payment_accounts" ("user_id");
CREATE INDEX "bnhub_payment_accounts_processor_account_id_idx" ON "bnhub_payment_accounts" ("processor_account_id");
CREATE INDEX "bnhub_payment_accounts_onboarding_status_idx" ON "bnhub_payment_accounts" ("onboarding_status");

CREATE TABLE "bnhub_payment_quotes" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT,
    "listing_id" TEXT NOT NULL,
    "guest_user_id" TEXT NOT NULL,
    "host_user_id" TEXT NOT NULL,
    "nightly_subtotal_cents" INTEGER NOT NULL,
    "cleaning_fee_cents" INTEGER NOT NULL DEFAULT 0,
    "tax_total_cents" INTEGER NOT NULL DEFAULT 0,
    "service_fee_cents" INTEGER NOT NULL DEFAULT 0,
    "add_on_total_cents" INTEGER NOT NULL DEFAULT 0,
    "bundle_total_cents" INTEGER NOT NULL DEFAULT 0,
    "membership_discount_cents" INTEGER NOT NULL DEFAULT 0,
    "coupon_discount_cents" INTEGER NOT NULL DEFAULT 0,
    "security_hold_cents" INTEGER NOT NULL DEFAULT 0,
    "grand_total_cents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "pricing_snapshot_json" JSONB NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bnhub_payment_quotes_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "bnhub_payment_quotes_booking_id_idx" ON "bnhub_payment_quotes" ("booking_id");
CREATE INDEX "bnhub_payment_quotes_listing_id_idx" ON "bnhub_payment_quotes" ("listing_id");
CREATE INDEX "bnhub_payment_quotes_guest_user_id_idx" ON "bnhub_payment_quotes" ("guest_user_id");
CREATE INDEX "bnhub_payment_quotes_host_user_id_idx" ON "bnhub_payment_quotes" ("host_user_id");
CREATE INDEX "bnhub_payment_quotes_expires_at_idx" ON "bnhub_payment_quotes" ("expires_at");

CREATE TABLE "bnhub_payments" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "payment_quote_id" TEXT,
    "legacy_payment_id" TEXT,
    "guest_user_id" TEXT NOT NULL,
    "host_user_id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "processor" "BnhubMpProcessor" NOT NULL,
    "processor_payment_intent_id" TEXT,
    "processor_checkout_session_id" TEXT,
    "amount_authorized_cents" INTEGER NOT NULL DEFAULT 0,
    "amount_captured_cents" INTEGER NOT NULL DEFAULT 0,
    "amount_refunded_cents" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "payment_status" "BnhubMpReservationPaymentStatus" NOT NULL DEFAULT 'DRAFT',
    "capture_mode" "BnhubMpCaptureMode" NOT NULL DEFAULT 'AUTOMATIC',
    "payment_method_type" TEXT,
    "funds_flow_type" "BnhubMpFundsFlow" NOT NULL DEFAULT 'DESTINATION_CHARGE',
    "risk_hold_status" "BnhubMpRiskHold" NOT NULL DEFAULT 'NONE',
    "metadata_json" JSONB NOT NULL DEFAULT '{}',
    "paid_at" TIMESTAMP(3),
    "idempotency_key" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "bnhub_payments_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "bnhub_payments_booking_id_key" ON "bnhub_payments" ("booking_id");
CREATE UNIQUE INDEX "bnhub_payments_legacy_payment_id_key" ON "bnhub_payments" ("legacy_payment_id");
CREATE UNIQUE INDEX "bnhub_payments_processor_payment_intent_id_key" ON "bnhub_payments" ("processor_payment_intent_id");
CREATE UNIQUE INDEX "bnhub_payments_processor_checkout_session_id_key" ON "bnhub_payments" ("processor_checkout_session_id");
CREATE UNIQUE INDEX "bnhub_payments_idempotency_key_key" ON "bnhub_payments" ("idempotency_key");
CREATE INDEX "bnhub_payments_guest_user_id_idx" ON "bnhub_payments" ("guest_user_id");
CREATE INDEX "bnhub_payments_host_user_id_idx" ON "bnhub_payments" ("host_user_id");
CREATE INDEX "bnhub_payments_listing_id_idx" ON "bnhub_payments" ("listing_id");
CREATE INDEX "bnhub_payments_payment_status_idx" ON "bnhub_payments" ("payment_status");
CREATE INDEX "bnhub_payments_created_at_idx" ON "bnhub_payments" ("created_at");

CREATE TABLE "bnhub_payouts" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "host_user_id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "processor" "BnhubMpProcessor" NOT NULL,
    "processor_transfer_id" TEXT,
    "processor_payout_id" TEXT,
    "gross_amount_cents" INTEGER NOT NULL,
    "platform_fee_cents" INTEGER NOT NULL DEFAULT 0,
    "reserve_amount_cents" INTEGER NOT NULL DEFAULT 0,
    "net_amount_cents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "payout_status" "BnhubMpPayoutStatus" NOT NULL DEFAULT 'PENDING',
    "release_reason" TEXT,
    "eligible_release_at" TIMESTAMP(3),
    "released_at" TIMESTAMP(3),
    "metadata_json" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "bnhub_payouts_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "bnhub_payouts_processor_transfer_id_key" ON "bnhub_payouts" ("processor_transfer_id");
CREATE INDEX "bnhub_payouts_booking_id_idx" ON "bnhub_payouts" ("booking_id");
CREATE INDEX "bnhub_payouts_payment_id_idx" ON "bnhub_payouts" ("payment_id");
CREATE INDEX "bnhub_payouts_host_user_id_idx" ON "bnhub_payouts" ("host_user_id");
CREATE INDEX "bnhub_payouts_payout_status_idx" ON "bnhub_payouts" ("payout_status");
CREATE INDEX "bnhub_payouts_eligible_release_at_idx" ON "bnhub_payouts" ("eligible_release_at");

CREATE TABLE "bnhub_payment_holds" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "payment_id" TEXT,
    "hold_type" "BnhubMpHoldType" NOT NULL,
    "hold_status" "BnhubMpHoldStatus" NOT NULL DEFAULT 'ACTIVE',
    "amount_cents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "reason" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3),
    "released_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "bnhub_payment_holds_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "bnhub_payment_holds_booking_id_idx" ON "bnhub_payment_holds" ("booking_id");
CREATE INDEX "bnhub_payment_holds_payment_id_idx" ON "bnhub_payment_holds" ("payment_id");
CREATE INDEX "bnhub_payment_holds_hold_status_idx" ON "bnhub_payment_holds" ("hold_status");

CREATE TABLE "bnhub_refunds" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "guest_user_id" TEXT NOT NULL,
    "host_user_id" TEXT NOT NULL,
    "refund_type" "BnhubMpRefundType" NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "refund_status" "BnhubMpRefundStatus" NOT NULL DEFAULT 'DRAFT',
    "processor_refund_id" TEXT,
    "reason_code" TEXT NOT NULL,
    "summary" TEXT,
    "initiated_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "bnhub_refunds_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "bnhub_refunds_processor_refund_id_key" ON "bnhub_refunds" ("processor_refund_id");
CREATE INDEX "bnhub_refunds_booking_id_idx" ON "bnhub_refunds" ("booking_id");
CREATE INDEX "bnhub_refunds_payment_id_idx" ON "bnhub_refunds" ("payment_id");
CREATE INDEX "bnhub_refunds_refund_status_idx" ON "bnhub_refunds" ("refund_status");

CREATE TABLE "bnhub_disputes" (
    "id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "processor_dispute_id" TEXT,
    "dispute_status" "BnhubMpDisputeStatus" NOT NULL DEFAULT 'OPEN',
    "amount_cents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "reason_code" TEXT,
    "evidence_due_by" TIMESTAMP(3),
    "summary" TEXT,
    "evidence_json" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "bnhub_disputes_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "bnhub_disputes_processor_dispute_id_key" ON "bnhub_disputes" ("processor_dispute_id");
CREATE INDEX "bnhub_disputes_booking_id_idx" ON "bnhub_disputes" ("booking_id");
CREATE INDEX "bnhub_disputes_dispute_status_idx" ON "bnhub_disputes" ("dispute_status");

CREATE TABLE "bnhub_payment_events" (
    "id" TEXT NOT NULL,
    "payment_id" TEXT,
    "payout_id" TEXT,
    "refund_id" TEXT,
    "dispute_id" TEXT,
    "booking_id" TEXT,
    "actor_type" "BnhubMpPaymentEventActor" NOT NULL,
    "actor_id" TEXT,
    "event_type" TEXT NOT NULL,
    "event_data_json" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bnhub_payment_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "bnhub_payment_events_payment_id_idx" ON "bnhub_payment_events" ("payment_id");
CREATE INDEX "bnhub_payment_events_booking_id_idx" ON "bnhub_payment_events" ("booking_id");
CREATE INDEX "bnhub_payment_events_event_type_idx" ON "bnhub_payment_events" ("event_type");
CREATE INDEX "bnhub_payment_events_created_at_idx" ON "bnhub_payment_events" ("created_at");

CREATE TABLE "bnhub_financial_ledgers" (
    "id" TEXT NOT NULL,
    "entity_type" "BnhubMpLedgerEntity" NOT NULL,
    "entity_id" TEXT NOT NULL,
    "booking_id" TEXT,
    "user_id" TEXT,
    "direction" "BnhubMpLedgerDirection" NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "entry_type" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bnhub_financial_ledgers_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "bnhub_financial_ledgers_entity_type_entity_id_idx" ON "bnhub_financial_ledgers" ("entity_type", "entity_id");
CREATE INDEX "bnhub_financial_ledgers_booking_id_idx" ON "bnhub_financial_ledgers" ("booking_id");
CREATE INDEX "bnhub_financial_ledgers_user_id_idx" ON "bnhub_financial_ledgers" ("user_id");
CREATE INDEX "bnhub_financial_ledgers_created_at_idx" ON "bnhub_financial_ledgers" ("created_at");

CREATE TABLE "bnhub_payment_processor_webhooks" (
    "id" TEXT NOT NULL,
    "processor" "BnhubMpProcessor" NOT NULL,
    "event_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload_json" JSONB NOT NULL,
    "processing_status" "BnhubMpWebhookInboxStatus" NOT NULL DEFAULT 'RECEIVED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "bnhub_payment_processor_webhooks_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "bnhub_payment_processor_webhooks_event_id_key" ON "bnhub_payment_processor_webhooks" ("event_id");
CREATE INDEX "bnhub_payment_processor_webhooks_event_type_idx" ON "bnhub_payment_processor_webhooks" ("event_type");
CREATE INDEX "bnhub_payment_processor_webhooks_processing_status_idx" ON "bnhub_payment_processor_webhooks" ("processing_status");
CREATE INDEX "bnhub_payment_processor_webhooks_created_at_idx" ON "bnhub_payment_processor_webhooks" ("created_at");

ALTER TABLE "bnhub_payment_accounts" ADD CONSTRAINT "bnhub_payment_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bnhub_payment_quotes" ADD CONSTRAINT "bnhub_payment_quotes_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "bnhub_payment_quotes" ADD CONSTRAINT "bnhub_payment_quotes_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bnhub_payment_quotes" ADD CONSTRAINT "bnhub_payment_quotes_guest_user_id_fkey" FOREIGN KEY ("guest_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bnhub_payment_quotes" ADD CONSTRAINT "bnhub_payment_quotes_host_user_id_fkey" FOREIGN KEY ("host_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bnhub_payments" ADD CONSTRAINT "bnhub_payments_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bnhub_payments" ADD CONSTRAINT "bnhub_payments_payment_quote_id_fkey" FOREIGN KEY ("payment_quote_id") REFERENCES "bnhub_payment_quotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "bnhub_payments" ADD CONSTRAINT "bnhub_payments_legacy_payment_id_fkey" FOREIGN KEY ("legacy_payment_id") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "bnhub_payments" ADD CONSTRAINT "bnhub_payments_guest_user_id_fkey" FOREIGN KEY ("guest_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bnhub_payments" ADD CONSTRAINT "bnhub_payments_host_user_id_fkey" FOREIGN KEY ("host_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bnhub_payments" ADD CONSTRAINT "bnhub_payments_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bnhub_payouts" ADD CONSTRAINT "bnhub_payouts_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bnhub_payouts" ADD CONSTRAINT "bnhub_payouts_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "bnhub_payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bnhub_payouts" ADD CONSTRAINT "bnhub_payouts_host_user_id_fkey" FOREIGN KEY ("host_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bnhub_payouts" ADD CONSTRAINT "bnhub_payouts_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bnhub_payment_holds" ADD CONSTRAINT "bnhub_payment_holds_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bnhub_payment_holds" ADD CONSTRAINT "bnhub_payment_holds_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "bnhub_payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "bnhub_refunds" ADD CONSTRAINT "bnhub_refunds_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bnhub_refunds" ADD CONSTRAINT "bnhub_refunds_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "bnhub_payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bnhub_refunds" ADD CONSTRAINT "bnhub_refunds_guest_user_id_fkey" FOREIGN KEY ("guest_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bnhub_refunds" ADD CONSTRAINT "bnhub_refunds_host_user_id_fkey" FOREIGN KEY ("host_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bnhub_disputes" ADD CONSTRAINT "bnhub_disputes_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "bnhub_payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bnhub_disputes" ADD CONSTRAINT "bnhub_disputes_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bnhub_payment_events" ADD CONSTRAINT "bnhub_payment_events_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "bnhub_payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "bnhub_payment_events" ADD CONSTRAINT "bnhub_payment_events_payout_id_fkey" FOREIGN KEY ("payout_id") REFERENCES "bnhub_payouts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "bnhub_payment_events" ADD CONSTRAINT "bnhub_payment_events_refund_id_fkey" FOREIGN KEY ("refund_id") REFERENCES "bnhub_refunds"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "bnhub_payment_events" ADD CONSTRAINT "bnhub_payment_events_dispute_id_fkey" FOREIGN KEY ("dispute_id") REFERENCES "bnhub_disputes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "bnhub_payment_events" ADD CONSTRAINT "bnhub_payment_events_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "bnhub_financial_ledgers" ADD CONSTRAINT "bnhub_financial_ledgers_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "bnhub_financial_ledgers" ADD CONSTRAINT "bnhub_financial_ledgers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
