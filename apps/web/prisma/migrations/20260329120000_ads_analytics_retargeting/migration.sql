-- AlterTable
ALTER TABLE "User" ADD COLUMN "is_retarget_candidate" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "marketing_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "manual_ad_spend_cad" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluate_funnel_sessions" (
    "session_id" TEXT NOT NULL,
    "user_id" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submitted_at" TIMESTAMP(3),

    CONSTRAINT "evaluate_funnel_sessions_pkey" PRIMARY KEY ("session_id")
);

-- CreateIndex
CREATE INDEX "evaluate_funnel_sessions_user_id_idx" ON "evaluate_funnel_sessions"("user_id");

-- CreateIndex
CREATE INDEX "evaluate_funnel_sessions_submitted_at_idx" ON "evaluate_funnel_sessions"("submitted_at");

-- CreateIndex
CREATE INDEX "traffic_events_path_created_at_idx" ON "traffic_events"("path", "created_at");

INSERT INTO "marketing_settings" ("id", "manual_ad_spend_cad", "updated_at")
VALUES ('default', 0, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
