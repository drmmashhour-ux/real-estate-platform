-- Notification delivery: preferences, per-channel audit log, web push subscriptions.

CREATE TABLE IF NOT EXISTS "notification_preferences" (
    "id" TEXT NOT NULL,
    "owner_type" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "email_enabled" BOOLEAN NOT NULL DEFAULT true,
    "sms_enabled" BOOLEAN NOT NULL DEFAULT false,
    "push_enabled" BOOLEAN NOT NULL DEFAULT true,
    "email_address" TEXT,
    "phone_number" TEXT,
    "alert_new_deals" BOOLEAN NOT NULL DEFAULT true,
    "alert_price_drop" BOOLEAN NOT NULL DEFAULT true,
    "alert_score_change" BOOLEAN NOT NULL DEFAULT true,
    "alert_buy_box" BOOLEAN NOT NULL DEFAULT true,
    "quiet_hours_start" INTEGER,
    "quiet_hours_end" INTEGER,
    "consent_granted" BOOLEAN NOT NULL DEFAULT false,
    "email_opt_in" BOOLEAN NOT NULL DEFAULT false,
    "sms_opt_in" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "notification_preferences_owner_key" ON "notification_preferences"("owner_type", "owner_id");
CREATE INDEX IF NOT EXISTS "idx_notification_preferences_owner_id" ON "notification_preferences"("owner_id");

CREATE TABLE IF NOT EXISTS "notification_logs" (
    "id" TEXT NOT NULL,
    "owner_type" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "alert_id" TEXT,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "provider_response" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_notification_logs_owner_id" ON "notification_logs"("owner_id");
CREATE INDEX IF NOT EXISTS "idx_notification_logs_alert_id" ON "notification_logs"("alert_id");
CREATE INDEX IF NOT EXISTS "idx_notification_logs_created_at_desc" ON "notification_logs"("created_at" DESC);

CREATE TABLE IF NOT EXISTS "push_subscriptions" (
    "id" TEXT NOT NULL,
    "owner_type" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "keys" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "push_subscriptions_owner_endpoint_key" ON "push_subscriptions"("owner_type", "owner_id", "endpoint");
CREATE INDEX IF NOT EXISTS "idx_push_subscriptions_owner_id" ON "push_subscriptions"("owner_id");
