-- LECIPM AI Autopilot Layer (transactional drafting / deals) — additive only.

CREATE TABLE "ai_autopilot_layer_config" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "mode" VARCHAR(32) NOT NULL DEFAULT 'ASSIST',
    "auto_drafting" BOOLEAN NOT NULL DEFAULT true,
    "auto_review" BOOLEAN NOT NULL DEFAULT true,
    "auto_suggestions" BOOLEAN NOT NULL DEFAULT true,
    "auto_broker_route" BOOLEAN NOT NULL DEFAULT false,
    "auto_pricing" BOOLEAN NOT NULL DEFAULT false,
    "paused" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_autopilot_layer_config_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ai_autopilot_layer_config_user_id_key" ON "ai_autopilot_layer_config"("user_id");

CREATE TABLE "ai_autopilot_layer_actions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "draft_id" UUID,
    "deal_id" TEXT,
    "action_key" VARCHAR(128) NOT NULL,
    "action_type" VARCHAR(64) NOT NULL,
    "mode" VARCHAR(32) NOT NULL,
    "status" VARCHAR(24) NOT NULL DEFAULT 'PROPOSED',
    "risk_level" VARCHAR(16) NOT NULL DEFAULT 'LOW',
    "payload_json" JSONB,
    "reason_fr" TEXT,
    "requires_approval" BOOLEAN NOT NULL DEFAULT true,
    "block_reason" TEXT,
    "approved_at" TIMESTAMP(3),
    "rejected_at" TIMESTAMP(3),
    "executed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_autopilot_layer_actions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ai_autopilot_layer_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "action_id" TEXT,
    "event_key" VARCHAR(64) NOT NULL,
    "payload_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_autopilot_layer_events_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ai_autopilot_layer_config" ADD CONSTRAINT "ai_autopilot_layer_config_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ai_autopilot_layer_actions" ADD CONSTRAINT "ai_autopilot_layer_actions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ai_autopilot_layer_actions" ADD CONSTRAINT "ai_autopilot_layer_actions_draft_id_fkey" FOREIGN KEY ("draft_id") REFERENCES "legal_form_drafts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ai_autopilot_layer_actions" ADD CONSTRAINT "ai_autopilot_layer_actions_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ai_autopilot_layer_events" ADD CONSTRAINT "ai_autopilot_layer_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ai_autopilot_layer_events" ADD CONSTRAINT "ai_autopilot_layer_events_action_id_fkey" FOREIGN KEY ("action_id") REFERENCES "ai_autopilot_layer_actions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "ai_autopilot_layer_actions_user_id_idx" ON "ai_autopilot_layer_actions"("user_id");
CREATE INDEX "ai_autopilot_layer_actions_draft_id_idx" ON "ai_autopilot_layer_actions"("draft_id");
CREATE INDEX "ai_autopilot_layer_actions_deal_id_idx" ON "ai_autopilot_layer_actions"("deal_id");
CREATE INDEX "ai_autopilot_layer_actions_status_idx" ON "ai_autopilot_layer_actions"("status");

CREATE INDEX "ai_autopilot_layer_events_user_id_idx" ON "ai_autopilot_layer_events"("user_id");
CREATE INDEX "ai_autopilot_layer_events_action_id_idx" ON "ai_autopilot_layer_events"("action_id");
CREATE INDEX "ai_autopilot_layer_events_event_key_idx" ON "ai_autopilot_layer_events"("event_key");
