-- CreateEnum
CREATE TYPE "LecipmAiOperatorActionStatus" AS ENUM ('pending', 'suggested', 'approved', 'executed', 'failed', 'rejected');

-- CreateTable
CREATE TABLE "ai_actions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "LecipmAiOperatorActionStatus" NOT NULL DEFAULT 'suggested',
    "confidence_score" DOUBLE PRECISION NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "data_used_summary" TEXT,
    "expected_outcome" TEXT,
    "suggested_execution" JSONB,
    "result_log" JSONB,
    "edited_payload" JSONB,
    "autonomy_mode_at_create" TEXT,
    "outcome_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lecipm_ai_operator_settings" (
    "user_id" TEXT NOT NULL,
    "autonomy_mode" TEXT NOT NULL DEFAULT 'manual',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lecipm_ai_operator_settings_pkey" PRIMARY KEY ("user_id")
);

-- CreateIndex
CREATE INDEX "ai_actions_user_id_status_idx" ON "ai_actions"("user_id", "status");

-- CreateIndex
CREATE INDEX "ai_actions_user_id_created_at_idx" ON "ai_actions"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "ai_actions_context_idx" ON "ai_actions"("context");

-- AddForeignKey
ALTER TABLE "ai_actions" ADD CONSTRAINT "ai_actions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lecipm_ai_operator_settings" ADD CONSTRAINT "lecipm_ai_operator_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
