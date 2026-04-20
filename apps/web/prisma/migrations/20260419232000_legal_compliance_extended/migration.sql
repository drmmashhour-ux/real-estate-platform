-- Phase 6–20: extended compliance tables + legal case/rule columns

ALTER TABLE "legal_cases" ADD COLUMN IF NOT EXISTS "category" TEXT;
ALTER TABLE "legal_cases" ADD COLUMN IF NOT EXISTS "linked_rule_ids" JSONB;

ALTER TABLE "legal_rules" ADD COLUMN IF NOT EXISTS "enabled" BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS "legal_cases_category_idx" ON "legal_cases"("category");
CREATE INDEX IF NOT EXISTS "legal_rules_enabled_idx" ON "legal_rules"("enabled");

CREATE TABLE IF NOT EXISTS "legal_alerts" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "risk_level" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "title" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "signals" JSONB NOT NULL DEFAULT '{}',
    "acknowledged_at" TIMESTAMP(3),
    "acknowledged_by_user_id" TEXT,
    "resolved_at" TIMESTAMP(3),
    "resolved_by_user_id" TEXT,
    "dismissed_at" TIMESTAMP(3),
    "dismissed_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "legal_alerts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "legal_alerts_status_idx" ON "legal_alerts"("status");
CREATE INDEX IF NOT EXISTS "legal_alerts_risk_level_idx" ON "legal_alerts"("risk_level");
CREATE INDEX IF NOT EXISTS "legal_alerts_entity_type_entity_id_idx" ON "legal_alerts"("entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS "legal_alerts_created_at_idx" ON "legal_alerts"("created_at");

CREATE TABLE IF NOT EXISTS "broker_verification_logs" (
    "id" TEXT NOT NULL,
    "broker_user_id" TEXT NOT NULL,
    "fsbo_listing_id" TEXT,
    "bnhub_host_listing_id" TEXT,
    "action_key" TEXT NOT NULL,
    "source_disclosed" BOOLEAN NOT NULL DEFAULT false,
    "verification_attempted" BOOLEAN NOT NULL DEFAULT false,
    "warning_issued" BOOLEAN NOT NULL DEFAULT false,
    "seller_marked_uncooperative" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "broker_verification_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "broker_verification_logs_broker_user_id_idx" ON "broker_verification_logs"("broker_user_id");
CREATE INDEX IF NOT EXISTS "broker_verification_logs_fsbo_listing_id_idx" ON "broker_verification_logs"("fsbo_listing_id");

CREATE TABLE IF NOT EXISTS "seller_disclosure_profiles" (
    "id" TEXT NOT NULL,
    "seller_user_id" TEXT NOT NULL,
    "misrepresentation_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "recurring_pattern_count" INTEGER NOT NULL DEFAULT 0,
    "signals" JSONB NOT NULL DEFAULT '{}',
    "last_evaluated_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seller_disclosure_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "seller_disclosure_profiles_seller_user_id_key" ON "seller_disclosure_profiles"("seller_user_id");
CREATE INDEX IF NOT EXISTS "seller_disclosure_profiles_misrepresentation_score_idx" ON "seller_disclosure_profiles"("misrepresentation_score");

CREATE TABLE IF NOT EXISTS "property_legal_profiles" (
    "id" TEXT NOT NULL,
    "listing_scope" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "latent_defect_risk_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "disclosure_risk_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fraud_risk_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "overall_legal_risk_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "latest_risk_level" TEXT NOT NULL DEFAULT 'MEDIUM',
    "last_evaluated_at" TIMESTAMP(3),
    "signals" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "property_legal_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "property_legal_profiles_listing_scope_listing_id_key" ON "property_legal_profiles"("listing_scope", "listing_id");
CREATE INDEX IF NOT EXISTS "property_legal_profiles_overall_legal_risk_score_idx" ON "property_legal_profiles"("overall_legal_risk_score");

CREATE TABLE IF NOT EXISTS "commission_legal_events" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "reason_key" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commission_legal_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "commission_legal_events_entity_type_entity_id_idx" ON "commission_legal_events"("entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS "commission_legal_events_reason_key_idx" ON "commission_legal_events"("reason_key");
CREATE INDEX IF NOT EXISTS "commission_legal_events_created_at_idx" ON "commission_legal_events"("created_at");
