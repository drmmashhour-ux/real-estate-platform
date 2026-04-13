-- LECIPM broker CRM autopilot (suggestions only; no auto-send in MVP)

CREATE TYPE "LecipmBrokerAutopilotMode" AS ENUM ('off', 'assist', 'safe_autopilot', 'approval_required');

CREATE TYPE "LecipmBrokerAutopilotActionType" AS ENUM (
  'follow_up_due',
  'reply_now',
  'schedule_visit',
  'mark_qualified',
  'reengage_lead',
  'close_lost'
);

CREATE TYPE "LecipmBrokerAutopilotActionStatus" AS ENUM (
  'suggested',
  'queued',
  'approved',
  'dismissed',
  'executed'
);

CREATE TABLE "lecipm_broker_autopilot_settings" (
    "id" TEXT NOT NULL,
    "broker_user_id" TEXT NOT NULL,
    "mode" "LecipmBrokerAutopilotMode" NOT NULL DEFAULT 'assist',
    "auto_draft_followups" BOOLEAN NOT NULL DEFAULT true,
    "auto_suggest_visits" BOOLEAN NOT NULL DEFAULT true,
    "auto_prioritize_hot_leads" BOOLEAN NOT NULL DEFAULT true,
    "daily_digest_enabled" BOOLEAN NOT NULL DEFAULT true,
    "pause_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lecipm_broker_autopilot_settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "lecipm_broker_autopilot_settings_broker_user_id_key" ON "lecipm_broker_autopilot_settings"("broker_user_id");

CREATE INDEX "lecipm_broker_autopilot_settings_broker_user_id_idx" ON "lecipm_broker_autopilot_settings"("broker_user_id");

ALTER TABLE "lecipm_broker_autopilot_settings" ADD CONSTRAINT "lecipm_broker_autopilot_settings_broker_user_id_fkey" FOREIGN KEY ("broker_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "lecipm_broker_autopilot_actions" (
    "id" TEXT NOT NULL,
    "broker_user_id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "thread_id" TEXT,
    "action_type" "LecipmBrokerAutopilotActionType" NOT NULL,
    "status" "LecipmBrokerAutopilotActionStatus" NOT NULL DEFAULT 'suggested',
    "title" VARCHAR(512) NOT NULL,
    "reason" TEXT NOT NULL,
    "reason_bucket" VARCHAR(80) NOT NULL,
    "draft_message" TEXT,
    "scheduled_for" TIMESTAMP(3),
    "dismissed_at" TIMESTAMP(3),
    "snoozed_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lecipm_broker_autopilot_actions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lecipm_broker_autopilot_actions_broker_user_id_idx" ON "lecipm_broker_autopilot_actions"("broker_user_id");
CREATE INDEX "lecipm_broker_autopilot_actions_lead_id_idx" ON "lecipm_broker_autopilot_actions"("lead_id");
CREATE INDEX "lecipm_broker_autopilot_actions_status_idx" ON "lecipm_broker_autopilot_actions"("status");
CREATE INDEX "lecipm_broker_autopilot_actions_action_type_idx" ON "lecipm_broker_autopilot_actions"("action_type");
CREATE INDEX "lecipm_broker_autopilot_actions_broker_user_id_status_idx" ON "lecipm_broker_autopilot_actions"("broker_user_id", "status");

ALTER TABLE "lecipm_broker_autopilot_actions" ADD CONSTRAINT "lecipm_broker_autopilot_actions_broker_user_id_fkey" FOREIGN KEY ("broker_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lecipm_broker_autopilot_actions" ADD CONSTRAINT "lecipm_broker_autopilot_actions_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "lecipm_broker_crm_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "lecipm_broker_daily_briefings" (
    "id" TEXT NOT NULL,
    "broker_user_id" TEXT NOT NULL,
    "briefing_date" DATE NOT NULL,
    "summary" TEXT NOT NULL,
    "high_priority_count" INTEGER NOT NULL DEFAULT 0,
    "followups_due_count" INTEGER NOT NULL DEFAULT 0,
    "overdue_count" INTEGER NOT NULL DEFAULT 0,
    "top_actions_json" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lecipm_broker_daily_briefings_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lecipm_broker_daily_briefings_broker_user_id_idx" ON "lecipm_broker_daily_briefings"("broker_user_id");
CREATE INDEX "lecipm_broker_daily_briefings_briefing_date_idx" ON "lecipm_broker_daily_briefings"("briefing_date");

CREATE UNIQUE INDEX "lecipm_broker_daily_briefings_broker_user_id_briefing_date_key" ON "lecipm_broker_daily_briefings"("broker_user_id", "briefing_date");

ALTER TABLE "lecipm_broker_daily_briefings" ADD CONSTRAINT "lecipm_broker_daily_briefings_broker_user_id_fkey" FOREIGN KEY ("broker_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
