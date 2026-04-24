-- LECIPM production feedback loop — append-only outcomes + learning audit (additive)

CREATE TABLE "lecipm_outcome_events" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "entity_type" VARCHAR(32) NOT NULL,
    "entity_id" VARCHAR(64) NOT NULL,
    "action_taken" VARCHAR(96) NOT NULL,
    "predicted_outcome" JSONB,
    "actual_outcome" JSONB,
    "delta" JSONB,
    "source" VARCHAR(48) NOT NULL DEFAULT 'log_hook',
    "log_tag" VARCHAR(24),
    "log_message" VARCHAR(512),
    "context_user_id" VARCHAR(32),
    "comparison_label" VARCHAR(16),
    "error_pattern_tags" JSONB,
    CONSTRAINT "lecipm_outcome_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lecipm_outcome_events_entity_type_created_at_idx" ON "lecipm_outcome_events"("entity_type", "created_at");
CREATE INDEX "lecipm_outcome_events_source_created_at_idx" ON "lecipm_outcome_events"("source", "created_at");
CREATE INDEX "lecipm_outcome_events_context_user_id_created_at_idx" ON "lecipm_outcome_events"("context_user_id", "created_at");

CREATE TABLE "lecipm_learning_feedback_audit" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PROPOSED',
    "domain" VARCHAR(48) NOT NULL,
    "payload" JSONB NOT NULL,
    "requires_review" BOOLEAN NOT NULL DEFAULT true,
    "created_by_user_id" VARCHAR(32),
    "approved_by_user_id" VARCHAR(32),
    "note" TEXT,
    "supersedes_id" VARCHAR(32),
    "previous_payload" JSONB,
    CONSTRAINT "lecipm_learning_feedback_audit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lecipm_learning_feedback_audit_domain_status_created_at_idx" ON "lecipm_learning_feedback_audit"("domain", "status", "created_at");
CREATE INDEX "lecipm_learning_feedback_audit_status_created_at_idx" ON "lecipm_learning_feedback_audit"("status", "created_at");
