-- Founder AI Copilot + Executive Briefing v1 — Québec residential brokerage executive layer

CREATE TYPE "ExecutiveBriefingStatus" AS ENUM ('draft', 'generated', 'reviewed', 'delivered', 'archived');
CREATE TYPE "ExecutiveBriefingDeliveryChannel" AS ENUM ('in_app', 'download', 'email_draft');
CREATE TYPE "ExecutiveBriefingDeliveryStatus" AS ENUM ('pending', 'completed', 'failed', 'cancelled');
CREATE TYPE "FounderActionStatus" AS ENUM ('open', 'accepted', 'rejected', 'delegated', 'completed', 'archived');

CREATE TABLE "executive_briefings" (
    "id" TEXT NOT NULL,
    "scope_kind" VARCHAR(16) NOT NULL,
    "scope_office_ids_json" JSONB NOT NULL DEFAULT '[]',
    "period_type" VARCHAR(32) NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "status" "ExecutiveBriefingStatus" NOT NULL DEFAULT 'draft',
    "generated_summary" JSONB NOT NULL DEFAULT '{}',
    "reviewed_by_user_id" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_by_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "executive_briefings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "executive_briefing_sections" (
    "id" TEXT NOT NULL,
    "briefing_id" TEXT NOT NULL,
    "section_key" VARCHAR(64) NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "content" JSONB NOT NULL DEFAULT '{}',
    "ordering" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "executive_briefing_sections_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "executive_briefing_deliveries" (
    "id" TEXT NOT NULL,
    "briefing_id" TEXT NOT NULL,
    "channel" "ExecutiveBriefingDeliveryChannel" NOT NULL,
    "status" "ExecutiveBriefingDeliveryStatus" NOT NULL DEFAULT 'pending',
    "delivered_at" TIMESTAMP(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "executive_briefing_deliveries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "founder_actions" (
    "id" TEXT NOT NULL,
    "source_type" VARCHAR(64) NOT NULL,
    "source_id" TEXT,
    "title" VARCHAR(500) NOT NULL,
    "summary" TEXT NOT NULL,
    "priority" VARCHAR(24) NOT NULL DEFAULT 'medium',
    "status" "FounderActionStatus" NOT NULL DEFAULT 'open',
    "assigned_to_user_id" TEXT,
    "created_by_user_id" TEXT NOT NULL,
    "scope_kind" VARCHAR(16) NOT NULL,
    "scope_office_ids_json" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "founder_actions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "founder_decision_logs" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "summary" TEXT NOT NULL,
    "linked_briefing_id" TEXT,
    "linked_insight_type" VARCHAR(64),
    "decided_by_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "founder_decision_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "executive_briefings_scope_kind_period_start_idx" ON "executive_briefings"("scope_kind", "period_start");
CREATE INDEX "executive_briefings_status_created_at_idx" ON "executive_briefings"("status", "created_at");

CREATE INDEX "executive_briefing_sections_briefing_id_ordering_idx" ON "executive_briefing_sections"("briefing_id", "ordering");

CREATE INDEX "executive_briefing_deliveries_briefing_id_channel_idx" ON "executive_briefing_deliveries"("briefing_id", "channel");

CREATE INDEX "founder_actions_status_created_at_idx" ON "founder_actions"("status", "created_at");
CREATE INDEX "founder_actions_created_by_user_id_idx" ON "founder_actions"("created_by_user_id");

CREATE INDEX "founder_decision_logs_decided_by_user_id_created_at_idx" ON "founder_decision_logs"("decided_by_user_id", "created_at");

ALTER TABLE "executive_briefings" ADD CONSTRAINT "executive_briefings_reviewed_by_user_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "executive_briefings" ADD CONSTRAINT "executive_briefings_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "executive_briefing_sections" ADD CONSTRAINT "executive_briefing_sections_briefing_id_fkey" FOREIGN KEY ("briefing_id") REFERENCES "executive_briefings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "executive_briefing_deliveries" ADD CONSTRAINT "executive_briefing_deliveries_briefing_id_fkey" FOREIGN KEY ("briefing_id") REFERENCES "executive_briefings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "founder_actions" ADD CONSTRAINT "founder_actions_assigned_to_user_id_fkey" FOREIGN KEY ("assigned_to_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "founder_actions" ADD CONSTRAINT "founder_actions_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "founder_decision_logs" ADD CONSTRAINT "founder_decision_logs_linked_briefing_id_fkey" FOREIGN KEY ("linked_briefing_id") REFERENCES "executive_briefings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "founder_decision_logs" ADD CONSTRAINT "founder_decision_logs_decided_by_user_id_fkey" FOREIGN KEY ("decided_by_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
