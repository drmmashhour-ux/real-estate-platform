-- AlterTable
ALTER TABLE "Lead" ADD COLUMN "source" TEXT,
ADD COLUMN "campaign" TEXT,
ADD COLUMN "medium" TEXT;

-- CreateIndex
CREATE INDEX "Lead_source_idx" ON "Lead"("source");

-- CreateIndex
CREATE INDEX "Lead_campaign_idx" ON "Lead"("campaign");

-- CreateTable
CREATE TABLE "traffic_events" (
    "id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "path" TEXT,
    "meta" JSONB,
    "source" TEXT,
    "campaign" TEXT,
    "medium" TEXT,
    "session_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "traffic_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "traffic_events_event_type_created_at_idx" ON "traffic_events"("event_type", "created_at");

-- CreateIndex
CREATE INDEX "traffic_events_source_created_at_idx" ON "traffic_events"("source", "created_at");

-- CreateIndex
CREATE INDEX "traffic_events_campaign_created_at_idx" ON "traffic_events"("campaign", "created_at");
