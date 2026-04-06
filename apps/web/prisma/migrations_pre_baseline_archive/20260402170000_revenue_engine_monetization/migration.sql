-- Revenue engine: user-centric events + opportunities

CREATE TABLE "revenue_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "event_type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "metadata_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "revenue_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "revenue_events_user_id_created_at_idx" ON "revenue_events"("user_id", "created_at");
CREATE INDEX "revenue_events_event_type_created_at_idx" ON "revenue_events"("event_type", "created_at");

ALTER TABLE "revenue_events" ADD CONSTRAINT "revenue_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "revenue_opportunities" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "lead_id" TEXT,
    "opportunity_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "value_estimate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "revenue_opportunities_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "revenue_opportunities_user_id_status_idx" ON "revenue_opportunities"("user_id", "status");
CREATE INDEX "revenue_opportunities_lead_id_status_idx" ON "revenue_opportunities"("lead_id", "status");
CREATE INDEX "revenue_opportunities_status_created_at_idx" ON "revenue_opportunities"("status", "created_at");

ALTER TABLE "revenue_opportunities" ADD CONSTRAINT "revenue_opportunities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "revenue_opportunities" ADD CONSTRAINT "revenue_opportunities_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
