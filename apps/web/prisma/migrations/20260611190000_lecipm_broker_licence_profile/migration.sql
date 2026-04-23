-- OACIQ residential licence profile + evaluation audit rows (LECIPM brokerage gate).

CREATE TABLE "lecipm_broker_licence_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "full_name" VARCHAR(256),
    "licence_number" VARCHAR(64),
    "licence_type" VARCHAR(32) NOT NULL DEFAULT 'residential',
    "licence_status" VARCHAR(24) NOT NULL DEFAULT 'pending',
    "neq" VARCHAR(32),
    "gst" VARCHAR(32),
    "qst" VARCHAR(32),
    "address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lecipm_broker_licence_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "lecipm_broker_licence_profiles_user_id_key" ON "lecipm_broker_licence_profiles"("user_id");

ALTER TABLE "lecipm_broker_licence_profiles" ADD CONSTRAINT "lecipm_broker_licence_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "lecipm_licence_checks" (
    "id" TEXT NOT NULL,
    "broker_id" TEXT NOT NULL,
    "profile_id" TEXT,
    "is_valid" BOOLEAN NOT NULL,
    "scope_valid" BOOLEAN NOT NULL,
    "risk_level" VARCHAR(16),
    "context_json" JSONB,
    "checked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lecipm_licence_checks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lecipm_licence_checks_broker_id_checked_at_idx" ON "lecipm_licence_checks"("broker_id", "checked_at" DESC);

ALTER TABLE "lecipm_licence_checks" ADD CONSTRAINT "lecipm_licence_checks_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lecipm_licence_checks" ADD CONSTRAINT "lecipm_licence_checks_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "lecipm_broker_licence_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
