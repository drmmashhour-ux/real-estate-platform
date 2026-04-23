-- Regulatory consent, audit trail, and risk disclosures (LECIPM / BNHub — additive)

CREATE TYPE "LecipmRegulatoryConsentType" AS ENUM ('DATA_USAGE', 'AI_DECISIONING', 'MARKETING', 'FINANCIAL_SIMULATION');
CREATE TYPE "LecipmRegulatoryAuditEntityType" AS ENUM ('DEAL', 'FUND', 'LISTING', 'AI_DECISION');
CREATE TYPE "LecipmRiskDisclosureContext" AS ENUM ('DEAL', 'FUND', 'ESG', 'AI_RECOMMENDATION');

CREATE TABLE "lecipm_regulatory_consents" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "consent_type" "LecipmRegulatoryConsentType" NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "lecipm_regulatory_consents_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "lecipm_regulatory_consents_user_id_consent_type_key" ON "lecipm_regulatory_consents"("user_id", "consent_type");
CREATE INDEX "lecipm_regulatory_consents_user_id_idx" ON "lecipm_regulatory_consents"("user_id");

ALTER TABLE "lecipm_regulatory_consents" ADD CONSTRAINT "lecipm_regulatory_consents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "lecipm_regulatory_audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "entity_type" "LecipmRegulatoryAuditEntityType" NOT NULL,
    "entity_id" VARCHAR(96) NOT NULL,
    "action" VARCHAR(160) NOT NULL,
    "metadata_json" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lecipm_regulatory_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lecipm_regulatory_audit_logs_entity_type_entity_id_idx" ON "lecipm_regulatory_audit_logs"("entity_type", "entity_id");
CREATE INDEX "lecipm_regulatory_audit_logs_user_id_created_at_idx" ON "lecipm_regulatory_audit_logs"("user_id", "created_at");

ALTER TABLE "lecipm_regulatory_audit_logs" ADD CONSTRAINT "lecipm_regulatory_audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "lecipm_risk_disclosures" (
    "id" TEXT NOT NULL,
    "context" "LecipmRiskDisclosureContext" NOT NULL,
    "message" TEXT NOT NULL,
    "version" VARCHAR(32) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lecipm_risk_disclosures_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "lecipm_risk_disclosures_context_version_key" ON "lecipm_risk_disclosures"("context", "version");
CREATE INDEX "lecipm_risk_disclosures_context_idx" ON "lecipm_risk_disclosures"("context");

CREATE TABLE "lecipm_user_risk_disclosure_acceptances" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "disclosure_id" TEXT NOT NULL,
    "accepted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lecipm_user_risk_disclosure_acceptances_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "lecipm_user_risk_disclosure_acceptances_user_id_disclosure_id_key" ON "lecipm_user_risk_disclosure_acceptances"("user_id", "disclosure_id");
CREATE INDEX "lecipm_user_risk_disclosure_acceptances_user_id_idx" ON "lecipm_user_risk_disclosure_acceptances"("user_id");

ALTER TABLE "lecipm_user_risk_disclosure_acceptances" ADD CONSTRAINT "lecipm_user_risk_disclosure_acceptances_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lecipm_user_risk_disclosure_acceptances" ADD CONSTRAINT "lecipm_user_risk_disclosure_acceptances_disclosure_id_fkey" FOREIGN KEY ("disclosure_id") REFERENCES "lecipm_risk_disclosures"("id") ON DELETE CASCADE ON UPDATE CASCADE;
