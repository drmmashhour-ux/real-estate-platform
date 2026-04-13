-- CreateEnum
CREATE TYPE "AnalyticsFunnelEventName" AS ENUM ('listing_view', 'contact_click', 'visit_request', 'visit_confirmed', 'deal_started', 'payment_completed');

-- CreateTable
CREATE TABLE "analytics_events" (
    "id" TEXT NOT NULL,
    "name" "AnalyticsFunnelEventName" NOT NULL,
    "listing_id" VARCHAR(64),
    "user_id" TEXT,
    "source" VARCHAR(128),
    "session_id" VARCHAR(64),
    "variant" VARCHAR(32),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "analytics_events_name_created_at_idx" ON "analytics_events"("name", "created_at");

-- CreateIndex
CREATE INDEX "analytics_events_listing_id_name_created_at_idx" ON "analytics_events"("listing_id", "name", "created_at");

-- CreateIndex
CREATE INDEX "analytics_events_user_id_name_created_at_idx" ON "analytics_events"("user_id", "name", "created_at");

-- AddForeignKey
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
