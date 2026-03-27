"use client";

import { useCallback, useEffect, useState } from "react";
import type { SystemValidationReport } from "@/src/modules/system-validation/types";
import { ConversionMetricsPanel } from "./ConversionMetricsPanel";
import { ErrorLogPanel } from "./ErrorLogPanel";
import { FlowStatusPanel } from "./FlowStatusPanel";
import { PerformanceMetricsPanel } from "./PerformanceMetricsPanel";
import { SystemReportViewer } from "./SystemReportViewer";
import { TestRunPanel } from "./TestRunPanel";

export function TestDashboard() {
  const [report, setReport] = useState<SystemValidationReport | null>(null);
  const [running, setRunning] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/admin/system-validation/report", { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.report) setReport(data.report as SystemValidationReport);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const onRun = async (opts: { skipScaling: boolean }) => {
    setRunning(true);
    setLastError(null);
    try {
      const res = await fetch("/api/admin/system-validation/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skipScaling: opts.skipScaling }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setLastError(typeof data.error === "string" ? data.error : "Run failed");
        return;
      }
      setReport(data.report as SystemValidationReport);
    } catch (e) {
      setLastError(e instanceof Error ? e.message : "Network error");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <TestRunPanel running={running} onRun={onRun} lastError={lastError} />
      {report ? (
        <>
          <section className="rounded-xl border border-slate-700 bg-slate-900/40 p-4">
            <h2 className="text-lg font-semibold text-slate-100">Summary</h2>
            <p className="mt-2 text-sm text-slate-400">
              Generated {report.generatedAt} · {report.usersCreated} users · Stripe sandbox:{" "}
              {report.environment.stripeSandboxOnly ? "yes" : "no"}
            </p>
            <ul className="mt-3 list-disc pl-5 text-sm text-amber-200/90">
              {report.recommendations.slice(0, 6).map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </section>
          <div className="grid gap-6 lg:grid-cols-2">
            <FlowStatusPanel flows={report.flows} />
            <PerformanceMetricsPanel samples={report.performance} scaling={report.scaling} />
            <ConversionMetricsPanel conversion={report.conversion} />
            <ErrorLogPanel errors={report.errors} />
          </div>
          <SystemReportViewer report={report} />
        </>
      ) : (
        <p className="text-sm text-slate-500">Load or run a test to see results.</p>
      )}
    </div>
  );
}
