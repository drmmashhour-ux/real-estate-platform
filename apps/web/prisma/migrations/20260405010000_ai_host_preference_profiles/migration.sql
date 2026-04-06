-- Per-host Autopilot preference profiles

CREATE TABLE "ai_host_preference_profiles" (
    "id" TEXT NOT NULL,
    "host_id" TEXT NOT NULL,
    "preferred_template_keys" JSONB NOT NULL DEFAULT '{}',
    "preferred_rule_weights" JSONB NOT NULL DEFAULT '{}',
    "rejection_patterns" JSONB NOT NULL DEFAULT '{}',
    "notification_sensitivity" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_host_preference_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ai_host_preference_profiles_host_id_key" ON "ai_host_preference_profiles"("host_id");
