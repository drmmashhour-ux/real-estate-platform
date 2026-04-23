-- LECIPM: guardrail rules, decisions, manual review queue

CREATE TABLE "compliance_guardrail_rules" (
    "id" TEXT NOT NULL,
    "rule_key" TEXT NOT NULL,
    "owner_type" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "module_key" TEXT NOT NULL,
    "action_key" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "enforcement_mode" TEXT NOT NULL,
    "condition_type" TEXT NOT NULL,
    "condition_config" JSONB,
    "message" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compliance_guardrail_rules_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "compliance_guardrail_rules_rule_key_key" ON "compliance_guardrail_rules"("rule_key");
CREATE INDEX "idx_guardrail_rule_owner" ON "compliance_guardrail_rules"("owner_type", "owner_id");
CREATE INDEX "idx_guardrail_rule_module_action" ON "compliance_guardrail_rules"("module_key", "action_key");

CREATE TABLE "compliance_guardrail_decisions" (
    "id" TEXT NOT NULL,
    "decision_number" TEXT NOT NULL,
    "owner_type" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "module_key" TEXT NOT NULL,
    "action_key" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "actor_type" TEXT,
    "actor_id" TEXT,
    "outcome" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "triggered_rule_key" TEXT,
    "reason_code" TEXT,
    "message" TEXT NOT NULL,
    "ai_assisted" BOOLEAN NOT NULL DEFAULT false,
    "override_allowed" BOOLEAN NOT NULL DEFAULT false,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compliance_guardrail_decisions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "compliance_guardrail_decisions_decision_number_key" ON "compliance_guardrail_decisions"("decision_number");
CREATE INDEX "idx_guardrail_decision_owner" ON "compliance_guardrail_decisions"("owner_type", "owner_id");
CREATE INDEX "idx_guardrail_decision_module" ON "compliance_guardrail_decisions"("module_key", "action_key");

CREATE TABLE "compliance_manual_review_queue" (
    "id" TEXT NOT NULL,
    "owner_type" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "module_key" TEXT NOT NULL,
    "action_key" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "decision_id" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'high',
    "reason" TEXT NOT NULL,
    "assigned_to_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compliance_manual_review_queue_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_manual_review_owner_status" ON "compliance_manual_review_queue"("owner_type", "owner_id", "status");

INSERT INTO "compliance_guardrail_rules" ("id", "rule_key", "owner_type", "owner_id", "module_key", "action_key", "severity", "enforcement_mode", "condition_type", "condition_config", "message", "active", "created_at")
VALUES
  (gen_random_uuid()::text, 'listing_publish_requires_seller_declaration', 'platform', 'platform', 'listings', 'publish_listing', 'critical', 'hard_block', 'missing_data', '{"field":"sellerDeclaration"}'::jsonb, 'Listing publication requires seller declaration.', true, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'trust_release_block_if_disputed', 'platform', 'platform', 'trust', 'release_deposit', 'critical', 'hard_block', 'invalid_state', '{"statuses":["disputed","frozen"]}'::jsonb, 'Disputed or frozen trust deposits cannot be released.', true, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'complaint_closure_requires_routing', 'platform', 'platform', 'complaints', 'close_complaint', 'high', 'hard_block', 'missing_data', '{"field":"routingDecision"}'::jsonb, 'Complaint closure requires routing decision.', true, CURRENT_TIMESTAMP)
ON CONFLICT ("rule_key") DO NOTHING;
