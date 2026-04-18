-- LECIPM Launch + Fraud Protection System v1 — auditable fraud_events log
CREATE TABLE "fraud_events" (
    "id" TEXT NOT NULL,
    "user_id" VARCHAR(40),
    "action_type" VARCHAR(64) NOT NULL,
    "risk_score" INTEGER NOT NULL,
    "risk_level" VARCHAR(24) NOT NULL,
    "reasons_json" JSONB NOT NULL DEFAULT '[]',
    "metadata_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fraud_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "fraud_events_user_id_created_at_idx" ON "fraud_events"("user_id", "created_at");
CREATE INDEX "fraud_events_risk_level_created_at_idx" ON "fraud_events"("risk_level", "created_at");
CREATE INDEX "fraud_events_action_type_created_at_idx" ON "fraud_events"("action_type", "created_at");
