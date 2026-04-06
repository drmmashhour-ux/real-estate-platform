-- Host Autopilot: template A/B stats + confidence calibration buckets

CREATE TABLE "ai_template_performance" (
    "id" TEXT NOT NULL,
    "template_key" TEXT NOT NULL,
    "rule_name" TEXT NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "successes" INTEGER NOT NULL DEFAULT 0,
    "failures" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_template_performance_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ai_template_performance_template_key_rule_name_key" ON "ai_template_performance"("template_key", "rule_name");
CREATE INDEX "ai_template_performance_rule_name_idx" ON "ai_template_performance"("rule_name");

CREATE TABLE "ai_confidence_calibration" (
    "id" TEXT NOT NULL,
    "rule_name" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "total" INTEGER NOT NULL DEFAULT 0,
    "success_count" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_confidence_calibration_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ai_confidence_calibration_rule_name_bucket_key" ON "ai_confidence_calibration"("rule_name", "bucket");
CREATE INDEX "ai_confidence_calibration_rule_name_idx" ON "ai_confidence_calibration"("rule_name");
