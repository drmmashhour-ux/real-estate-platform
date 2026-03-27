-- CreateTable
CREATE TABLE "growth_funnel_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "event_name" TEXT NOT NULL,
    "properties" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "growth_funnel_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "growth_usage_counters" (
    "user_id" TEXT NOT NULL,
    "simulator_runs" INTEGER NOT NULL DEFAULT 0,
    "ai_drafts" INTEGER NOT NULL DEFAULT 0,
    "last_return_visit_at" TIMESTAMPTZ(6),
    "activation_completed_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "growth_usage_counters_pkey" PRIMARY KEY ("user_id")
);

-- CreateIndex
CREATE INDEX "idx_growth_funnel_event_name_time" ON "growth_funnel_events"("event_name", "created_at");

-- CreateIndex
CREATE INDEX "idx_growth_funnel_user" ON "growth_funnel_events"("user_id");

-- AddForeignKey
ALTER TABLE "growth_funnel_events" ADD CONSTRAINT "growth_funnel_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "growth_usage_counters" ADD CONSTRAINT "growth_usage_counters_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
