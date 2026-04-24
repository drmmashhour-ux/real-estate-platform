-- OACIQ-aligned compliance mapping + evaluation events (platform assistance; broker remains liable).

CREATE TYPE "OaciqComplianceRuleCategory" AS ENUM ('DISCLOSURE', 'CONFLICT', 'CLIENT_PROTECTION', 'DOCUMENTATION');
CREATE TYPE "OaciqComplianceAlignmentAction" AS ENUM ('DEAL_CREATE', 'LISTING_PUBLISH', 'CONTRACT_GENERATE');

CREATE TABLE "oaciq_compliance_rules" (
    "id" TEXT NOT NULL,
    "rule_key" VARCHAR(80) NOT NULL,
    "title" VARCHAR(256) NOT NULL,
    "description" TEXT NOT NULL,
    "category" "OaciqComplianceRuleCategory" NOT NULL,
    "enforced_by_system" BOOLEAN NOT NULL DEFAULT true,
    "applies_deal_create" BOOLEAN NOT NULL DEFAULT true,
    "applies_listing_publish" BOOLEAN NOT NULL DEFAULT true,
    "applies_contract_generate" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oaciq_compliance_rules_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "oaciq_compliance_rules_rule_key_key" ON "oaciq_compliance_rules"("rule_key");
CREATE INDEX "oaciq_compliance_rules_active_category_idx" ON "oaciq_compliance_rules"("active", "category");

CREATE TABLE "oaciq_compliance_alignment_events" (
    "id" TEXT NOT NULL,
    "broker_id" TEXT NOT NULL,
    "action" "OaciqComplianceAlignmentAction" NOT NULL,
    "outcome" VARCHAR(16) NOT NULL,
    "failed_rule_keys" JSONB,
    "listing_id" VARCHAR(36),
    "pipeline_deal_id" VARCHAR(36),
    "crm_deal_id" VARCHAR(36),
    "sd_transaction_id" VARCHAR(36),
    "legal_artifact_id" VARCHAR(36),
    "details_json" JSONB,
    "resolved_at" TIMESTAMP(3),
    "resolution_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oaciq_compliance_alignment_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "oaciq_compliance_alignment_events_broker_id_created_at_idx" ON "oaciq_compliance_alignment_events"("broker_id", "created_at" DESC);
CREATE INDEX "oaciq_compliance_alignment_events_outcome_resolved_at_idx" ON "oaciq_compliance_alignment_events"("outcome", "resolved_at");

INSERT INTO "oaciq_compliance_rules" (
    "id", "rule_key", "title", "description", "category", "enforced_by_system",
    "applies_deal_create", "applies_listing_publish", "applies_contract_generate", "active", "created_at", "updated_at"
) VALUES
(
    'oaciq_rule_broker_status_disclosure',
    'alignment_broker_status_disclosure',
    'Broker status disclosure',
    'Licensed residential broker path: OACIQ licence recorded on the broker profile before brokerage actions proceed.',
    'DISCLOSURE',
    true,
    true,
    true,
    true,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    'oaciq_rule_conflict_interest',
    'alignment_conflict_interest_disclosure',
    'Conflict of interest disclosure',
    'When a conflict check exists for the listing or deal, the broker must have confirmed the conflict declaration before proceeding.',
    'CONFLICT',
    true,
    true,
    true,
    true,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    'oaciq_rule_client_information',
    'alignment_client_information_transparency',
    'Client information transparency',
    'Broker profile must include identifiable contact information (name and email) used for professional transparency.',
    'CLIENT_PROTECTION',
    true,
    true,
    true,
    true,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    'oaciq_rule_documentation',
    'alignment_documentation_completeness',
    'Documentation completeness',
    'Listing publication requires a stored compliance snapshot; deal-linked document generation requires a valid CRM deal record.',
    'DOCUMENTATION',
    true,
    true,
    true,
    true,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT ("rule_key") DO NOTHING;
