-- LECIPM Manager: per-host AI autopilot configuration
CREATE TABLE "manager_ai_host_autopilot_settings" (
    "user_id" TEXT NOT NULL,
    "autopilot_enabled" BOOLEAN NOT NULL DEFAULT false,
    "autopilot_mode" TEXT NOT NULL DEFAULT 'OFF',
    "auto_pricing" BOOLEAN NOT NULL DEFAULT false,
    "auto_messaging" BOOLEAN NOT NULL DEFAULT false,
    "auto_promotions" BOOLEAN NOT NULL DEFAULT false,
    "auto_listing_optimization" BOOLEAN NOT NULL DEFAULT false,
    "last_autopilot_run_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "manager_ai_host_autopilot_settings_pkey" PRIMARY KEY ("user_id")
);

ALTER TABLE "manager_ai_host_autopilot_settings" ADD CONSTRAINT "manager_ai_host_autopilot_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
