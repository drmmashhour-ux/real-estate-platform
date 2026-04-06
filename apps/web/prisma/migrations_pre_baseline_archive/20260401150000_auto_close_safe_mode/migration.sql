-- Safe auto-close: admin pause + audit trail (no financial / negotiation automation).

CREATE TABLE "auto_close_settings" (
    "id" TEXT NOT NULL,
    "paused" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auto_close_settings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "auto_close_settings" ("id", "paused", "updated_at") VALUES ('global', false, CURRENT_TIMESTAMP);

CREATE TABLE "auto_close_audit_events" (
    "id" TEXT NOT NULL,
    "action_type" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "safe_mode" BOOLEAN NOT NULL,
    "detail" JSONB,
    "reverted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auto_close_audit_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "auto_close_audit_events_created_at_idx" ON "auto_close_audit_events"("created_at");
CREATE INDEX "auto_close_audit_events_target_type_target_id_idx" ON "auto_close_audit_events"("target_type", "target_id");
