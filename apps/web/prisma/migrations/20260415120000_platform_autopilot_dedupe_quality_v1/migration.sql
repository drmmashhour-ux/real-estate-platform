-- LECIPM AI Autopilot dedupe + quality scoring v1 (additive)

ALTER TABLE "platform_autopilot_actions" ADD COLUMN "fingerprint" VARCHAR(64);
ALTER TABLE "platform_autopilot_actions" ADD COLUMN "quality_score" INTEGER;
ALTER TABLE "platform_autopilot_actions" ADD COLUMN "value_score" INTEGER;
ALTER TABLE "platform_autopilot_actions" ADD COLUMN "noise_penalty" INTEGER;
ALTER TABLE "platform_autopilot_actions" ADD COLUMN "priority_bucket" VARCHAR(32);
ALTER TABLE "platform_autopilot_actions" ADD COLUMN "duplicate_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "platform_autopilot_actions" ADD COLUMN "last_detected_at" TIMESTAMP(3);
ALTER TABLE "platform_autopilot_actions" ADD COLUMN "last_refreshed_at" TIMESTAMP(3);

CREATE INDEX "idx_platform_autopilot_action_fingerprint_status" ON "platform_autopilot_actions"("fingerprint", "status");
