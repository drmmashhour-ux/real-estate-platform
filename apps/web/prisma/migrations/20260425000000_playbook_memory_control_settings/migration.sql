-- Wave 10: operator control settings (playbook memory experiment / exploration caps)

CREATE TABLE "playbook_control_settings" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scope_type" TEXT NOT NULL,
    "scope_key" TEXT NOT NULL,
    "exploration_cap" DOUBLE PRECISION,
    "force_mode" TEXT,
    "emergency_freeze" BOOLEAN NOT NULL DEFAULT false,
    "updated_by_user_id" TEXT,
    "reason" TEXT,
    CONSTRAINT "playbook_control_settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "playbook_control_settings_scope" ON "playbook_control_settings"("scope_type", "scope_key");
CREATE INDEX "playbook_control_settings_scope_type_updated_at_idx" ON "playbook_control_settings"("scope_type", "updated_at");
