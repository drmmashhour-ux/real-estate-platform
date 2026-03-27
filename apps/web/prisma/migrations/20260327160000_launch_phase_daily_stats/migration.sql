-- CreateTable
CREATE TABLE "launch_phase_daily_stats" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "messages_sent" INTEGER NOT NULL DEFAULT 0,
    "replies_received" INTEGER NOT NULL DEFAULT 0,
    "demos_booked" INTEGER NOT NULL DEFAULT 0,
    "demos_completed" INTEGER NOT NULL DEFAULT 0,
    "users_created" INTEGER NOT NULL DEFAULT 0,
    "activated_users" INTEGER NOT NULL DEFAULT 0,
    "paying_users" INTEGER NOT NULL DEFAULT 0,
    "posts_created" INTEGER NOT NULL DEFAULT 0,
    "content_views" INTEGER NOT NULL DEFAULT 0,
    "content_clicks" INTEGER NOT NULL DEFAULT 0,
    "content_conversions" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "launch_phase_daily_stats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "launch_phase_daily_stats_date_key" ON "launch_phase_daily_stats"("date");

-- CreateIndex
CREATE INDEX "launch_phase_daily_stats_date_idx" ON "launch_phase_daily_stats"("date");
