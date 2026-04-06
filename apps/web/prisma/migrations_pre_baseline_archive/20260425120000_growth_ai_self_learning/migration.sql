-- Self-learning layer: template performance, experiments, decisions, outcome ledger, manual overrides.

ALTER TABLE "growth_ai_conversations" ADD COLUMN IF NOT EXISTS "recommended_template_key" VARCHAR(64);
ALTER TABLE "growth_ai_conversations" ADD COLUMN IF NOT EXISTS "learning_flag" VARCHAR(32);

CREATE TABLE IF NOT EXISTS "growth_ai_template_performance" (
    "id" TEXT NOT NULL,
    "template_key" VARCHAR(64) NOT NULL,
    "stage" VARCHAR(32) NOT NULL DEFAULT '',
    "detected_intent" VARCHAR(48) NOT NULL DEFAULT '',
    "detected_objection" VARCHAR(32) NOT NULL DEFAULT '',
    "high_intent" BOOLEAN NOT NULL DEFAULT false,
    "sent_count" INTEGER NOT NULL DEFAULT 0,
    "reply_count" INTEGER NOT NULL DEFAULT 0,
    "qualified_count" INTEGER NOT NULL DEFAULT 0,
    "booked_count" INTEGER NOT NULL DEFAULT 0,
    "handoff_count" INTEGER NOT NULL DEFAULT 0,
    "stale_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "growth_ai_template_performance_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "growth_ai_template_performance_template_key_stage_detected_intent_detected_objection_high_intent_key" ON "growth_ai_template_performance"("template_key", "stage", "detected_intent", "detected_objection", "high_intent");

CREATE INDEX IF NOT EXISTS "growth_ai_template_performance_template_key_idx" ON "growth_ai_template_performance"("template_key");

CREATE INDEX IF NOT EXISTS "growth_ai_template_performance_stage_detected_intent_detected_objection_idx" ON "growth_ai_template_performance"("stage", "detected_intent", "detected_objection");

CREATE INDEX IF NOT EXISTS "growth_ai_template_performance_high_intent_idx" ON "growth_ai_template_performance"("high_intent");

CREATE TABLE IF NOT EXISTS "growth_ai_routing_experiments" (
    "id" TEXT NOT NULL,
    "experiment_key" VARCHAR(64) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "control_template_key" VARCHAR(64) NOT NULL,
    "variant_template_key" VARCHAR(64) NOT NULL,
    "stage" VARCHAR(32),
    "detected_intent" VARCHAR(48),
    "detected_objection" VARCHAR(32),
    "high_intent" BOOLEAN,
    "allocation_percent" INTEGER NOT NULL DEFAULT 50,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "growth_ai_routing_experiments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "growth_ai_routing_experiments_experiment_key_key" ON "growth_ai_routing_experiments"("experiment_key");

CREATE INDEX IF NOT EXISTS "growth_ai_routing_experiments_is_active_idx" ON "growth_ai_routing_experiments"("is_active");

CREATE TABLE IF NOT EXISTS "growth_ai_conversation_decisions" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "message_id" TEXT,
    "stage" VARCHAR(32),
    "detected_intent" VARCHAR(48),
    "detected_objection" VARCHAR(32),
    "high_intent" BOOLEAN NOT NULL DEFAULT false,
    "selected_template_key" VARCHAR(64) NOT NULL,
    "reason_json" JSONB,
    "was_experiment" BOOLEAN NOT NULL DEFAULT false,
    "experiment_key" VARCHAR(64),
    "outcome_at_selection" VARCHAR(32),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "growth_ai_conversation_decisions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "growth_ai_conversation_decisions_conversation_id_idx" ON "growth_ai_conversation_decisions"("conversation_id");

CREATE INDEX IF NOT EXISTS "growth_ai_conversation_decisions_selected_template_key_idx" ON "growth_ai_conversation_decisions"("selected_template_key");

CREATE INDEX IF NOT EXISTS "growth_ai_conversation_decisions_experiment_key_idx" ON "growth_ai_conversation_decisions"("experiment_key");

ALTER TABLE "growth_ai_conversation_decisions" ADD CONSTRAINT "growth_ai_conversation_decisions_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "growth_ai_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "growth_ai_template_outcome_events" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "event_key" VARCHAR(48) NOT NULL,
    "decision_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "growth_ai_template_outcome_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "growth_ai_template_outcome_events_conversation_id_event_key_key" ON "growth_ai_template_outcome_events"("conversation_id", "event_key");

CREATE INDEX IF NOT EXISTS "growth_ai_template_outcome_events_conversation_id_idx" ON "growth_ai_template_outcome_events"("conversation_id");

ALTER TABLE "growth_ai_template_outcome_events" ADD CONSTRAINT "growth_ai_template_outcome_events_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "growth_ai_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "growth_ai_learning_manual_overrides" (
    "id" TEXT NOT NULL,
    "stage" VARCHAR(32) NOT NULL DEFAULT '',
    "detected_intent" VARCHAR(48) NOT NULL DEFAULT '',
    "detected_objection" VARCHAR(32) NOT NULL DEFAULT '',
    "high_intent" BOOLEAN NOT NULL DEFAULT false,
    "override_template_key" VARCHAR(64) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "growth_ai_learning_manual_overrides_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "growth_ai_learning_manual_overrides_stage_detected_intent_detected_objection_high_intent_key" ON "growth_ai_learning_manual_overrides"("stage", "detected_intent", "detected_objection", "high_intent");

CREATE INDEX IF NOT EXISTS "growth_ai_learning_manual_overrides_is_active_idx" ON "growth_ai_learning_manual_overrides"("is_active");
