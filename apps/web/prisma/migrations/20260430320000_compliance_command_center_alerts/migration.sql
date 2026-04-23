-- Command-center alerts (acknowledgeable cockpit items)
CREATE TABLE "compliance_alerts" (
    "id" TEXT NOT NULL,
    "owner_type" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "alert_type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledged_by_id" TEXT,
    "acknowledged_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compliance_alerts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_compliance_alert_owner_ack" ON "compliance_alerts"("owner_type", "owner_id", "acknowledged");
