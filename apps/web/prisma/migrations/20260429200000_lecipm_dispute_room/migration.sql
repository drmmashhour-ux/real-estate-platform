-- Platform Dispute Room (additive; distinct from BNHub disputes)

CREATE TYPE "LecipmDisputeCaseEntityType" AS ENUM ('BOOKING', 'DEAL', 'LISTING', 'PAYMENT');
CREATE TYPE "LecipmDisputeCaseStatus" AS ENUM ('OPEN', 'IN_REVIEW', 'RESOLVED', 'REJECTED', 'ESCALATED');
CREATE TYPE "LecipmDisputeCasePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');
CREATE TYPE "LecipmDisputeCaseCategory" AS ENUM ('NO_SHOW', 'PAYMENT', 'MISLEADING_LISTING', 'OTHER');
CREATE TYPE "LecipmDisputeCaseEventType" AS ENUM ('CREATED', 'STATUS_CHANGE', 'MESSAGE_ADDED', 'EVIDENCE_ADDED', 'ESCALATED', 'ADMIN_NOTE', 'RESOLUTION_PROPOSED');

ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'DISPUTE_CASE';

CREATE TABLE "lecipm_dispute_cases" (
    "id" TEXT NOT NULL,
    "related_entity_type" "LecipmDisputeCaseEntityType" NOT NULL,
    "related_entity_id" VARCHAR(64) NOT NULL,
    "opened_by_user_id" TEXT NOT NULL,
    "against_user_id" TEXT,
    "status" "LecipmDisputeCaseStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "LecipmDisputeCasePriority" NOT NULL DEFAULT 'MEDIUM',
    "category" "LecipmDisputeCaseCategory" NOT NULL,
    "title" VARCHAR(280) NOT NULL,
    "description" TEXT NOT NULL,
    "resolution_notes" TEXT,
    "resolved_at" TIMESTAMP(3),
    "resolved_by_user_id" TEXT,
    "escalated_at" TIMESTAMP(3),
    "internal_admin_notes" TEXT,
    "ai_assist_summary" TEXT,
    "ai_assist_hints_json" JSONB,
    "ai_assist_generated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lecipm_dispute_cases_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "lecipm_dispute_case_messages" (
    "id" TEXT NOT NULL,
    "dispute_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "attachments" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lecipm_dispute_case_messages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "lecipm_dispute_case_events" (
    "id" TEXT NOT NULL,
    "dispute_id" TEXT NOT NULL,
    "event_type" "LecipmDisputeCaseEventType" NOT NULL,
    "payload" JSONB NOT NULL,
    "actor_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lecipm_dispute_case_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lecipm_dispute_cases_opened_by_user_id_idx" ON "lecipm_dispute_cases"("opened_by_user_id");
CREATE INDEX "lecipm_dispute_cases_against_user_id_idx" ON "lecipm_dispute_cases"("against_user_id");
CREATE INDEX "lecipm_dispute_cases_status_idx" ON "lecipm_dispute_cases"("status");
CREATE INDEX "lecipm_dispute_cases_priority_idx" ON "lecipm_dispute_cases"("priority");
CREATE INDEX "lecipm_dispute_cases_category_idx" ON "lecipm_dispute_cases"("category");
CREATE INDEX "lecipm_dispute_cases_related_entity_type_related_entity_id_idx" ON "lecipm_dispute_cases"("related_entity_type", "related_entity_id");
CREATE INDEX "lecipm_dispute_cases_created_at_idx" ON "lecipm_dispute_cases"("created_at");

CREATE INDEX "lecipm_dispute_case_messages_dispute_id_idx" ON "lecipm_dispute_case_messages"("dispute_id");
CREATE INDEX "lecipm_dispute_case_messages_created_at_idx" ON "lecipm_dispute_case_messages"("created_at");

CREATE INDEX "lecipm_dispute_case_events_dispute_id_idx" ON "lecipm_dispute_case_events"("dispute_id");
CREATE INDEX "lecipm_dispute_case_events_created_at_idx" ON "lecipm_dispute_case_events"("created_at");

ALTER TABLE "lecipm_dispute_cases" ADD CONSTRAINT "lecipm_dispute_cases_opened_by_user_id_fkey" FOREIGN KEY ("opened_by_user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "lecipm_dispute_cases" ADD CONSTRAINT "lecipm_dispute_cases_against_user_id_fkey" FOREIGN KEY ("against_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "lecipm_dispute_cases" ADD CONSTRAINT "lecipm_dispute_cases_resolved_by_user_id_fkey" FOREIGN KEY ("resolved_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "lecipm_dispute_case_messages" ADD CONSTRAINT "lecipm_dispute_case_messages_dispute_id_fkey" FOREIGN KEY ("dispute_id") REFERENCES "lecipm_dispute_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lecipm_dispute_case_messages" ADD CONSTRAINT "lecipm_dispute_case_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lecipm_dispute_case_events" ADD CONSTRAINT "lecipm_dispute_case_events_dispute_id_fkey" FOREIGN KEY ("dispute_id") REFERENCES "lecipm_dispute_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lecipm_dispute_case_events" ADD CONSTRAINT "lecipm_dispute_case_events_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
