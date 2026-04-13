"use client";

import { useCallback, useEffect, useState } from "react";

type LogRow = {
  id: string;
  hub: string;
  feature: string;
  intent: string;
  riskLevel: string | null;
  createdAt: string;
  inputSummary: string;
  outputSummary: string;
};

export function LegalAiMonitorClient() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [report, setReport] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [totals, setTotals] = useState<{ count?: number; byFeature?: Record<string, number> } | null>(null);
  const [demoExtras, setDemoExtras] = useState<{
    violationsSample?: unknown[];
    suspiciousListingsSample?: string[];
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/legal-ai/report", { credentials: "same-origin" });
      const j = (await res.json()) as {
        report?: string;
        error?: string;
        logs?: LogRow[];
        totals?: { count?: number; byFeature?: Record<string, number> };
        violationsSample?: unknown[];
        suspiciousListingsSample?: string[];
        source?: string;
      };
      if (!res.ok) {
        setErr(typeof j.error === "string" ? j.error : "Failed to load");
        return;
      }
      setReport(typeof j.report === "string" ? j.report : null);
      setLogs(Array.isArray(j.logs) ? j.logs : []);
      setTotals(j.totals ?? null);
      if (j.source === "demo") {
        setDemoExtras({
          violationsSample: j.violationsSample,
          suspiciousListingsSample: j.suspiciousListingsSample,
        });
      } else {
        setDemoExtras(null);
      }
    } catch {
      setErr("Failed to load report");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-8">
      {loading ? <p className="text-sm text-slate-500">Loading legal AI monitor…</p> : null}
      {err ? <p className="text-sm text-red-400">{err}</p> : null}

      {totals ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="text-sm font-semibold text-white">Last 7 days</h2>
          <p className="mt-1 text-2xl font-bold text-emerald-400">{totals.count ?? 0}</p>
          <p className="text-xs text-slate-500">Legal-context AI interactions logged</p>
          {totals.byFeature && Object.keys(totals.byFeature).length > 0 ? (
            <ul className="mt-3 text-xs text-slate-400">
              {Object.entries(totals.byFeature).map(([k, v]) => (
                <li key={k}>
                  {k}: {v}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {demoExtras?.violationsSample ? (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-5">
          <h3 className="text-sm font-semibold text-amber-100">Demo: sample violations / misuse patterns</h3>
          <pre className="mt-2 overflow-x-auto text-xs text-amber-100/90">
            {JSON.stringify(demoExtras.violationsSample, null, 2)}
          </pre>
        </div>
      ) : null}

      {demoExtras?.suspiciousListingsSample ? (
        <div className="rounded-2xl border border-rose-500/25 bg-rose-950/15 p-5">
          <h3 className="text-sm font-semibold text-rose-100">Demo: suspicious listings (IDs)</h3>
          <ul className="mt-2 list-inside list-disc text-xs text-rose-100/85">
            {demoExtras.suspiciousListingsSample.map((id) => (
              <li key={id}>{id}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {report ? (
        <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-6">
          <h2 className="text-lg font-semibold text-white">Legal Risk Report (AI-generated)</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">{report}</p>
        </div>
      ) : null}

      {logs.length > 0 ? (
        <div>
          <h2 className="text-sm font-semibold text-white">Recent legal-context AI logs</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-xs text-slate-300">
              <thead className="border-b border-white/10 text-slate-500">
                <tr>
                  <th className="py-2 pr-2">Time</th>
                  <th className="py-2 pr-2">Hub</th>
                  <th className="py-2 pr-2">Feature</th>
                  <th className="py-2 pr-2">Intent</th>
                  <th className="py-2">Summary</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((row) => (
                  <tr key={row.id} className="border-b border-white/5">
                    <td className="py-2 pr-2 align-top text-slate-500">
                      {new Date(row.createdAt).toLocaleString()}
                    </td>
                    <td className="py-2 pr-2 align-top">{row.hub}</td>
                    <td className="py-2 pr-2 align-top">{row.feature}</td>
                    <td className="py-2 pr-2 align-top">{row.intent}</td>
                    <td className="py-2 align-top text-slate-500">
                      {(row.outputSummary ?? "").slice(0, 160)}
                      {(row.outputSummary ?? "").length > 160 ? "…" : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {!loading && !report && !err ? (
        <p className="text-sm text-slate-500">No legal AI data in the selected window yet.</p>
      ) : null}
    </div>
  );
}
