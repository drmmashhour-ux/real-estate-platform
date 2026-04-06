-- CreateEnum
CREATE TYPE "UserEventType" AS ENUM ('ANALYZE', 'SAVE_DEAL', 'COMPARE', 'VISIT_PAGE');

-- CreateTable
CREATE TABLE "user_events" (
    "id" TEXT NOT NULL,
    "eventType" "UserEventType" NOT NULL,
    "metadata" JSONB,
    "sessionId" VARCHAR(64),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "user_events_eventType_created_at_idx" ON "user_events"("eventType", "created_at");
CREATE INDEX "user_events_created_at_idx" ON "user_events"("created_at");

-- CreateTable
CREATE TABLE "user_feedback" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "rating" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_feedback_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "user_feedback_created_at_idx" ON "user_feedback"("created_at");
