-- LECIPM Security Hardening v1 — auditable security_events (additive)
CREATE TYPE "SecurityEventSeverity" AS ENUM ('info', 'low', 'medium', 'high', 'critical');

CREATE TABLE "security_events" (
    "id" TEXT NOT NULL,
    "type" VARCHAR(64) NOT NULL,
    "severity" "SecurityEventSeverity" NOT NULL DEFAULT 'low',
    "user_id" TEXT,
    "ip" VARCHAR(64),
    "user_agent" VARCHAR(512),
    "path" VARCHAR(512),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "security_events_type_created_at_idx" ON "security_events"("type", "created_at");
CREATE INDEX "security_events_severity_created_at_idx" ON "security_events"("severity", "created_at");
CREATE INDEX "security_events_ip_created_at_idx" ON "security_events"("ip", "created_at");
