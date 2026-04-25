import { logInfo } from "@/lib/logger";

const TAG = "[executive-report]";

export function logExecutiveReportGenerated(meta: Record<string, unknown>) {
  logInfo(`${TAG} report_generated`, meta);
}

export function logExecutivePdfCreated(meta: Record<string, unknown>) {
  logInfo(`${TAG} pdf_created`, meta);
}

export function logExecutiveReportSent(meta: Record<string, unknown>) {
  logInfo(`${TAG} report_sent`, meta);
}

export function logExecutiveScheduleTriggered(meta: Record<string, unknown>) {
  logInfo(`${TAG} schedule_triggered`, meta);
}
