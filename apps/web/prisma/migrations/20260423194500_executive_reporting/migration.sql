-- Executive / board reporting (auditable JSON snapshots)

CREATE TYPE "ExecutiveReportStatus" AS ENUM ('GENERATED', 'SENT', 'FAILED');

CREATE TYPE "ExecutiveReportScheduleFrequency" AS ENUM ('WEEKLY', 'MONTHLY');

CREATE TABLE "executive_reports" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "period_key" VARCHAR(32) NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "report_json" JSONB NOT NULL,
    "summary_text" TEXT NOT NULL,
    "status" "ExecutiveReportStatus" NOT NULL DEFAULT 'GENERATED',
    "error_message" TEXT,

    CONSTRAINT "executive_reports_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "executive_reports_period_key_generated_at_idx" ON "executive_reports"("period_key", "generated_at" DESC);

CREATE TABLE "executive_report_schedules" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "frequency" "ExecutiveReportScheduleFrequency" NOT NULL,
    "recipients_json" JSONB NOT NULL,
    "last_run_at" TIMESTAMPTZ(6),
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "executive_report_schedules_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "executive_report_schedules_is_active_idx" ON "executive_report_schedules"("is_active");
