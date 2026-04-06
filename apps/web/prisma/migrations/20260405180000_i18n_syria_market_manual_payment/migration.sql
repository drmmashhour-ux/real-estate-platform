-- CreateEnum
CREATE TYPE "ManualPaymentSettlement" AS ENUM ('NOT_APPLICABLE', 'PENDING', 'RECEIVED', 'FAILED', 'WAIVED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "preferred_ui_locale" VARCHAR(8);

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN "manual_payment_settlement" "ManualPaymentSettlement" NOT NULL DEFAULT 'NOT_APPLICABLE';
ALTER TABLE "Booking" ADD COLUMN "manual_payment_updated_at" TIMESTAMP(3);
ALTER TABLE "Booking" ADD COLUMN "manual_payment_updated_by_user_id" TEXT;

-- CreateTable
CREATE TABLE "booking_manual_payment_events" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "actor_user_id" TEXT,
    "from_settlement" "ManualPaymentSettlement" NOT NULL,
    "to_settlement" "ManualPaymentSettlement" NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_manual_payment_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "booking_manual_payment_events_booking_id_created_at_idx" ON "booking_manual_payment_events"("booking_id", "created_at");

ALTER TABLE "booking_manual_payment_events" ADD CONSTRAINT "booking_manual_payment_events_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "platform_market_launch_settings" (
    "id" TEXT NOT NULL,
    "active_market_code" VARCHAR(32) NOT NULL DEFAULT 'default',
    "syria_mode_enabled" BOOLEAN NOT NULL DEFAULT false,
    "online_payments_enabled" BOOLEAN NOT NULL DEFAULT true,
    "manual_payment_tracking_enabled" BOOLEAN NOT NULL DEFAULT true,
    "contact_first_emphasis" BOOLEAN NOT NULL DEFAULT false,
    "default_display_currency" VARCHAR(8) NOT NULL DEFAULT 'USD',
    "default_language_codes_json" JSONB,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_market_launch_settings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "platform_market_launch_settings" ("id", "active_market_code", "syria_mode_enabled", "online_payments_enabled", "manual_payment_tracking_enabled", "contact_first_emphasis", "default_display_currency", "updated_at")
VALUES ('default', 'default', false, true, true, false, 'USD', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
