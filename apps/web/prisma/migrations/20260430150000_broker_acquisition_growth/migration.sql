-- Broker acquisition: optional lead tag, onboarding profile, activation events
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "growth_tag" VARCHAR(64);

CREATE INDEX IF NOT EXISTS "Lead_growth_tag_idx" ON "Lead"("growth_tag");

CREATE TABLE IF NOT EXISTS "broker_profile" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "display_name" VARCHAR(256),
    "phone" VARCHAR(40),
    "markets_json" JSONB,
    "specializations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "goals_json" JSONB,
    "onboarding_completed_at" TIMESTAMP(3),
    "first_value_shown_at" TIMESTAMP(3),
    "referred_by_broker_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "broker_profile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "broker_profile_user_id_key" ON "broker_profile"("user_id");

CREATE INDEX IF NOT EXISTS "broker_profile_onboarding_completed_at_idx" ON "broker_profile"("onboarding_completed_at");

CREATE INDEX IF NOT EXISTS "broker_profile_referred_by_broker_id_idx" ON "broker_profile"("referred_by_broker_id");

ALTER TABLE "broker_profile" ADD CONSTRAINT "broker_profile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "broker_profile" ADD CONSTRAINT "broker_profile_referred_by_broker_id_fkey" FOREIGN KEY ("referred_by_broker_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "broker_activity" (
    "id" TEXT NOT NULL,
    "broker_id" TEXT NOT NULL,
    "event_type" VARCHAR(48) NOT NULL,
    "ref_id" VARCHAR(64),
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "broker_activity_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "broker_activity_broker_id_event_type_created_at_idx" ON "broker_activity"("broker_id", "event_type", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "broker_activity_broker_id_ref_id_idx" ON "broker_activity"("broker_id", "ref_id");

ALTER TABLE "broker_activity" ADD CONSTRAINT "broker_activity_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
