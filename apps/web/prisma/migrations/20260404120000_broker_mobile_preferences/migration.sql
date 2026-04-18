-- Broker mobile preferences (push categories, privacy, snoozed daily actions)
CREATE TABLE "broker_mobile_preferences" (
    "user_id" TEXT NOT NULL,
    "push_category_settings" JSONB NOT NULL DEFAULT '{}',
    "privacy_minimize_lock_screen" BOOLEAN NOT NULL DEFAULT false,
    "snoozed_actions_json" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "broker_mobile_preferences_pkey" PRIMARY KEY ("user_id")
);

CREATE UNIQUE INDEX "broker_mobile_preferences_user_id_key" ON "broker_mobile_preferences"("user_id");

ALTER TABLE "broker_mobile_preferences" ADD CONSTRAINT "broker_mobile_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
