-- OACIQ guideline sections: versioned rule bundles + evaluation audit trail (broker remains professionally liable).

CREATE TABLE IF NOT EXISTS "oaciq_compliance_sections" (
    "id" TEXT NOT NULL,
    "section_key" VARCHAR(128) NOT NULL,
    "section_title_fr" VARCHAR(500) NOT NULL,
    "section_title_en" VARCHAR(500),
    "source_excerpt" TEXT,
    "rule_engine_json" JSONB NOT NULL,
    "ai_behavior_json" JSONB NOT NULL,
    "clause_fr" TEXT NOT NULL,
    "clause_en" TEXT,
    "default_risk_level" VARCHAR(16) NOT NULL DEFAULT 'MEDIUM',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "effective_from" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "oaciq_compliance_sections_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "oaciq_compliance_sections_section_key_key" ON "oaciq_compliance_sections"("section_key");
CREATE INDEX IF NOT EXISTS "idx_oaciq_compliance_sections_active_key" ON "oaciq_compliance_sections"("active", "section_key");

CREATE TABLE IF NOT EXISTS "oaciq_compliance_evaluation_logs" (
    "id" TEXT NOT NULL,
    "section_id" TEXT NOT NULL,
    "broker_user_id" TEXT NOT NULL,
    "deal_id" VARCHAR(128),
    "listing_id" VARCHAR(128),
    "outcome" VARCHAR(16) NOT NULL,
    "compliance_risk_score" VARCHAR(16) NOT NULL,
    "context_json" JSONB,
    "triggered_rules_json" JSONB,
    "blocked_actions_json" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oaciq_compliance_evaluation_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_oaciq_eval_logs_broker_created" ON "oaciq_compliance_evaluation_logs"("broker_user_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_oaciq_eval_logs_section_created" ON "oaciq_compliance_evaluation_logs"("section_id", "created_at" DESC);

ALTER TABLE "oaciq_compliance_evaluation_logs" ADD CONSTRAINT "oaciq_compliance_evaluation_logs_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "oaciq_compliance_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
