import type { ComplianceReportRun } from "@prisma/client";

export function assertReportScopeAndType(input: {
  reportKey?: string | null;
  reportType?: string | null;
  scopeType?: string | null;
}) {
  if (!input.reportKey?.trim() || !input.reportType?.trim() || !input.scopeType?.trim()) {
    throw new Error("REPORT_SCOPE_AND_TYPE_REQUIRED");
  }
}

/** Legal-hold rows must not be silently dropped from export manifests. */
export function assertLegalHoldRecordsNotOmitted(omitLegalHoldRecords?: boolean) {
  if (omitLegalHoldRecords === true) {
    throw new Error("LEGAL_HOLD_RECORDS_MUST_REMAIN_INCLUDED");
  }
}

export function assertReportRunMutable(run: Pick<ComplianceReportRun, "status">) {
  if (run.status === "sealed") {
    throw new Error("IMMUTABLE_REPORT");
  }
}
