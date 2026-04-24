-- Wave 13: auditable user preference + journey (product signals only; no protected-trait fields)

CREATE TABLE "user_preference_profiles_w13" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" TEXT NOT NULL,
    "active_snapshot_id" TEXT,
    "household_profile" JSONB,
    "housing_preferences" JSONB,
    "lifestyle_preferences" JSONB,
    "neighborhood_preferences" JSONB,
    "budget_preferences" JSONB,
    "accessibility_preferences" JSONB,
    "design_preferences" JSONB,
    "confidence_score" DOUBLE PRECISION,
    "last_inferred_at" TIMESTAMP(3),
    "last_interaction_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "user_preference_profiles_w13_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_preference_profiles_w13_user_id_key" ON "user_preference_profiles_w13"("user_id");
CREATE UNIQUE INDEX "user_preference_profiles_w13_active_snapshot_id_key" ON "user_preference_profiles_w13"("active_snapshot_id");
CREATE INDEX "user_preference_profiles_w13_user_id_is_active_idx" ON "user_preference_profiles_w13"("user_id", "is_active");

CREATE TABLE "user_preference_snapshots_w13" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "snapshot_type" TEXT NOT NULL,
    "profile_json" JSONB NOT NULL,
    "summary" TEXT,
    "source" TEXT,

    CONSTRAINT "user_preference_snapshots_w13_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "user_preference_snapshots_w13_user_id_created_at_idx" ON "user_preference_snapshots_w13"("user_id", "created_at");
CREATE INDEX "user_preference_snapshots_w13_profile_id_created_at_idx" ON "user_preference_snapshots_w13"("profile_id", "created_at");

CREATE TABLE "user_journey_states_w13" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" TEXT NOT NULL,
    "current_intent" TEXT,
    "current_domain" TEXT,
    "current_stage" TEXT,
    "current_search_mode" TEXT,
    "latest_city" TEXT,
    "latest_budget_band" TEXT,
    "latest_property_intent" TEXT,
    "latest_household_band" TEXT,
    "summary_json" JSONB,
    "last_activity_at" TIMESTAMP(3),

    CONSTRAINT "user_journey_states_w13_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_journey_states_w13_user_id_key" ON "user_journey_states_w13"("user_id");
CREATE INDEX "user_journey_states_w13_current_domain_current_stage_idx" ON "user_journey_states_w13"("current_domain", "current_stage");

CREATE TABLE "user_preference_signals_w13" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" TEXT NOT NULL,
    "profile_id" TEXT,
    "source_domain" TEXT NOT NULL,
    "source_type" TEXT NOT NULL,
    "source_id" TEXT,
    "signal_key" TEXT NOT NULL,
    "signal_value_json" JSONB NOT NULL,
    "signal_weight" DOUBLE PRECISION,
    "confidence" DOUBLE PRECISION,
    "explicit_user_provided" BOOLEAN NOT NULL DEFAULT false,
    "derived_from_behavior" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMP(3),
    "last_observed_at" TIMESTAMP(3),

    CONSTRAINT "user_preference_signals_w13_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "user_preference_signals_w13_user_id_signal_key_created_at_idx" ON "user_preference_signals_w13"("user_id", "signal_key", "created_at");
CREATE INDEX "user_preference_signals_w13_source_domain_source_type_create_idx" ON "user_preference_signals_w13"("source_domain", "source_type", "created_at");

-- FKs (order: parent tables first, then child)
ALTER TABLE "user_preference_profiles_w13" ADD CONSTRAINT "user_preference_profiles_w13_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_journey_states_w13" ADD CONSTRAINT "user_journey_states_w13_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Snapshots reference profile
ALTER TABLE "user_preference_snapshots_w13" ADD CONSTRAINT "user_preference_snapshots_w13_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "user_preference_profiles_w13"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Profile active pointer (1:1)
ALTER TABLE "user_preference_profiles_w13" ADD CONSTRAINT "user_preference_profiles_w13_active_snapshot_id_fkey" FOREIGN KEY ("active_snapshot_id") REFERENCES "user_preference_snapshots_w13"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Signals
ALTER TABLE "user_preference_signals_w13" ADD CONSTRAINT "user_preference_signals_w13_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_preference_signals_w13" ADD CONSTRAINT "user_preference_signals_w13_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "user_preference_profiles_w13"("id") ON DELETE SET NULL ON UPDATE CASCADE;
