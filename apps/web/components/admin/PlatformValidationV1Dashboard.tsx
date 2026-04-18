"use client";

import { useCallback, useEffect, useState } from "react";

import type { PlatformValidationReportV1 } from "@/modules/validation/types";

export function PlatformValidationV1Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [path, setPath] = useState<string | null>(null);
  const [report, setReport] = useState<PlatformValidationReportV1 | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/validation/platform-v1", { cache: "no-store" });
      const json = (await res.json()) as {
        ok?: boolean;
        missing?: boolean;
        hint?: string;
        path?: string;
        report?: PlatformValidationReportV1;
        error?: string;
      };
      if (!res.ok) {
        setError(json.error ?? `HTTP ${res.status}`);
        setReport(null);
        return;
      }
      if (json.missing) {
        setMissing(true);
        setHint(json.hint ?? null);
        setPath(json.path ?? null);
        setReport(null);
        return;
      }
      setMissing(false);
      setPath(json.path ?? null);
      setReport(json.report ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const decision = report?.launch.decision;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 text-zinc-100">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Platform validation (v1)</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Reads <code className="text-zinc-300">tests/reports/final-validation-report.json</code> produced by{" "}
            <code className="text-zinc-300">pnpm validate:platform</code>. Set{" "}
            <code className="text-zinc-300">LECIPM_PLATFORM_VALIDATION_V1_REPORT_PATH</code> to override.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm font-medium hover:bg-zinc-700"
        >
          Refresh
        </button>
      </div>

      {path && !missing && (
        <p className="mb-4 text-xs text-zinc-500">
          File: <code className="text-zinc-400">{path}</code>
        </p>
      )}

      {loading && <p className="text-zinc-400">Loading…</p>}
      {error && (
        <div className="rounded-lg border border-red-900/80 bg-red-950/40 p-4 text-red-200">{error}</div>
      )}
      {missing && !loading && (
        <div className="rounded-lg border border-amber-800/80 bg-amber-950/30 p-4 text-amber-100">
          <p className="font-medium">No report file found.</p>
          {hint && <p className="mt-2 text-sm opacity-90">{hint}</p>}
        </div>
      )}

      {report && !loading && (
        <div className="space-y-6">
          <div
            className={`rounded-lg border p-4 ${
              decision === "GO"
                ? "border-emerald-800/80 bg-emerald-950/30"
                : decision === "GO_WITH_WARNINGS"
                  ? "border-amber-800/80 bg-amber-950/30"
                  : "border-red-800/80 bg-red-950/30"
            }`}
          >
            <p className="text-lg font-semibold">
              Decision:{" "}
              <span
                className={
                  decision === "GO"
                    ? "text-emerald-300"
                    : decision === "GO_WITH_WARNINGS"
                      ? "text-amber-200"
                      : "text-red-300"
                }
              >
                {decision}
              </span>
            </p>
            <p className="mt-1 text-sm text-zinc-400">
              {report.meta.generatedAt} — mode {report.meta.mode} — base {report.meta.baseUrl}
            </p>
          </div>

          {report.launch.blockers.length > 0 && (
            <div>
              <h2 className="text-lg font-medium text-red-200">Blockers</h2>
              <ul className="mt-2 list-inside list-disc text-sm text-red-100/90">
                {report.launch.blockers.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </div>
          )}

          {report.launch.warnings.length > 0 && (
            <div>
              <h2 className="text-lg font-medium text-amber-200">Warnings</h2>
              <ul className="mt-2 list-inside list-disc text-sm text-amber-100/90">
                {report.launch.warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h2 className="text-lg font-medium text-zinc-200">Summary</h2>
            <ul className="mt-2 text-sm text-zinc-400">
              <li>Pages probed: {report.pages.length}</li>
              <li>API checks: {report.apis.length}</li>
              <li>Security checks: {report.security.length}</li>
              <li>Scenarios: {report.scenarios.length}</li>
              <li>Routes discovered (map): {report.routeMapSummary.totalDiscovered}</li>
            </ul>
          </div>

          <details className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
            <summary className="cursor-pointer text-sm font-medium text-zinc-300">Raw JSON</summary>
            <pre className="mt-3 max-h-[480px] overflow-auto text-xs text-zinc-500">{JSON.stringify(report, null, 2)}</pre>
          </details>
        </div>
      )}
    </div>
  );
}
