"use client";

import type { SystemValidationReport } from "@/src/modules/system-validation/types";

type Props = {
  report: SystemValidationReport | null;
};

export function SystemReportViewer({ report }: Props) {
  if (!report) {
    return <p className="text-sm text-slate-500">No report loaded.</p>;
  }
  return (
    <details className="rounded-xl border border-slate-700 bg-slate-950/40 p-4">
      <summary className="cursor-pointer text-sm font-medium text-slate-200">Raw JSON report</summary>
      <pre className="mt-3 max-h-96 overflow-auto text-xs text-slate-400">{JSON.stringify(report, null, 2)}</pre>
    </details>
  );
}
