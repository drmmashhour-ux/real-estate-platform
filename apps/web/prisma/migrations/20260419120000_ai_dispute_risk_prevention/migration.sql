-- CreateEnum
CREATE TYPE "AiDisputeRiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "AiDisputeRiskSignalType" AS ENUM (
  'MISSING_CHECKIN_DETAILS',
  'MISSING_CHECKIN_COMPLETION',
  'GUEST_SLOW_RESPONSE',
  'HOST_SLOW_RESPONSE',
  'REPEATED_BOOKING_ISSUES',
  'NEGATIVE_FEEDBACK_SIGNAL',
  'INCOMPLETE_LISTING_SIGNAL',
  'HOST_ROOM_READINESS_MISSING'
);

-- CreateEnum
CREATE TYPE "AiDisputePreventionAction" AS ENUM (
  'GENTLE_REMINDER',
  'NOTIFY_BOTH_PARTIES',
  'NOTIFY_ADMIN_ESCALATION'
);

-- CreateTable
CREATE TABLE "ai_dispute_risk_logs" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "risk_level" "AiDisputeRiskLevel" NOT NULL,
    "signal_type" "AiDisputeRiskSignalType" NOT NULL,
    "summary" VARCHAR(500) NOT NULL,
    "recommended_action" TEXT NOT NULL,
    "prevention_action" "AiDisputePreventionAction" NOT NULL,
    "message_draft_host" TEXT,
    "message_draft_guest" TEXT,
    "action_taken" VARCHAR(64) NOT NULL DEFAULT 'risk_detected',
    "metadata_json" JSONB,
    "cooldown_key" VARCHAR(200) NOT NULL,
    "requires_admin_review" BOOLEAN NOT NULL DEFAULT false,
    "admin_reviewed_at" TIMESTAMP(3),
    "notification_sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_dispute_risk_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_dispute_risk_logs_booking_id_created_at_idx" ON "ai_dispute_risk_logs"("booking_id", "created_at");

-- CreateIndex
CREATE INDEX "ai_dispute_risk_logs_requires_admin_review_created_at_idx" ON "ai_dispute_risk_logs"("requires_admin_review", "created_at");

-- CreateIndex
CREATE INDEX "ai_dispute_risk_logs_signal_type_created_at_idx" ON "ai_dispute_risk_logs"("signal_type", "created_at");

-- AddForeignKey
ALTER TABLE "ai_dispute_risk_logs" ADD CONSTRAINT "ai_dispute_risk_logs_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
