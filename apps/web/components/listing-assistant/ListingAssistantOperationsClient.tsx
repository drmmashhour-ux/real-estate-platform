"use client";

import { useCallback, useEffect, useState } from "react";

type OpsPayload = {
  generatedAt: string;
  recentDrafts: Array<{
    id: string;
    listingId: string;
    listingCode: string | null;
    listingTitle: string;
    phase: string;
    source: string;
    createdAt: string;
  }>;
  readinessPreview: Array<{
    versionId: string;
    listingId: string;
    listingCode: string | null;
    listingTitle: string;
    phase: string;
    createdAt: string;
    readinessStatus: string;
    readinessScore: number;
  }>;
  commonComplianceWarnings: Array<{ warning: string; count: number }>;
  assistedPerformance: Array<{
    listingId: string;
    listingCode: string | null;
    title: string;
    viewsTotal: number;
    contactClicks: number;
    conversionProxy: number;
    leadCount: number;
    versionCount: number;
  }>;
  benchmarkConversionProxyNonAssisted: number | null;
  assistedUnderperformanceAlerts: Array<{
    listingId: string;
    listingCode: string | null;
    title: string;
    viewsTotal: number;
    conversionProxy: number;
    note: string;
  }>;
};

export function ListingAssistantOperationsClient() {
  const [data, setData] = useState<OpsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/listing/assistant/operations/summary");
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof j.error === "string" ? j.error : "load_failed");
        return;
      }
      setData(j as OpsPayload);
    } catch {
      setError("network_error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Assistive telemetry — correlational only; broker validates creative and pricing before publishing.
        </p>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm dark:border-slate-600"
        >
          Refresh
        </button>
      </div>

      {loading ?
        <p className="text-sm text-slate-500">Loading operations bundle…</p>
      : null}
      {error ?
        <p className="text-sm text-red-600">{error}</p>
      : null}

      {data ?
        <>
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Recent assistant drafts</h2>
            <ul className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
              {data.recentDrafts.length === 0 ?
                <li className="py-3 text-sm text-slate-500">No versions recorded yet.</li>
              : data.recentDrafts.map((d) => (
                  <li key={d.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm">
                    <span className="font-mono text-xs text-slate-500">{d.listingCode ?? d.listingId.slice(0, 8)}</span>
                    <span className="text-slate-700 dark:text-slate-300">{d.listingTitle}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs uppercase dark:bg-slate-800">
                      {d.phase}
                    </span>
                    <time className="text-xs text-slate-500" dateTime={d.createdAt}>
                      {new Date(d.createdAt).toLocaleString()}
                    </time>
                  </li>
                ))
              }
            </ul>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Readiness snapshot</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {data.readinessPreview.map((r) => (
                  <li key={r.versionId} className="flex justify-between gap-2">
                    <span className="truncate text-slate-700 dark:text-slate-300">{r.listingTitle}</span>
                    <span
                      className={
                        r.readinessStatus === "HIGH_RISK" ? "text-red-600"
                        : r.readinessStatus === "NEEDS_EDITS" ? "text-amber-600"
                        : "text-emerald-600"
                      }
                    >
                      {r.readinessStatus} ({r.readinessScore})
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">High-risk drafts</h2>
              <ul className="mt-3 list-inside list-disc text-sm text-red-700 dark:text-red-400">
                {data.readinessPreview.filter((r) => r.readinessStatus === "HIGH_RISK").length === 0 ?
                  <li>None flagged in window.</li>
                : data.readinessPreview
                    .filter((r) => r.readinessStatus === "HIGH_RISK")
                    .map((h) => (
                      <li key={h.versionId}>
                        {h.listingTitle} · score {h.readinessScore}
                      </li>
                    ))
                }
              </ul>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Common compliance warnings</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300">
              {data.commonComplianceWarnings.map((w) => (
                <li key={w.warning.slice(0, 80)}>
                  <span className="font-semibold text-slate-900 dark:text-white">×{w.count}</span> {w.warning}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Assisted listing performance</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Benchmark non-assisted proxy:{" "}
              <strong>
                {data.benchmarkConversionProxyNonAssisted == null ?
                  "—"
                : `${(data.benchmarkConversionProxyNonAssisted * 100).toFixed(2)}%`}
              </strong>{" "}
              (contacts ÷ views)
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-700">
                    <th className="py-2">Listing</th>
                    <th className="py-2">Views</th>
                    <th className="py-2">Clicks</th>
                    <th className="py-2">Leads</th>
                    <th className="py-2">Conv. proxy</th>
                  </tr>
                </thead>
                <tbody>
                  {data.assistedPerformance.map((p) => (
                    <tr key={p.listingId} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="py-2">{p.title}</td>
                      <td className="py-2">{p.viewsTotal}</td>
                      <td className="py-2">{p.contactClicks}</td>
                      <td className="py-2">{p.leadCount}</td>
                      <td className="py-2">{(p.conversionProxy * 100).toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-2xl border border-amber-300/50 bg-amber-950/20 p-6 dark:border-amber-700/40">
            <h2 className="text-lg font-semibold text-amber-950 dark:text-amber-100">Performance watchlist</h2>
            <ul className="mt-3 space-y-3 text-sm text-amber-950 dark:text-amber-100">
              {data.assistedUnderperformanceAlerts.length === 0 ?
                <li>No assisted listings flagged for engagement drag.</li>
              : data.assistedUnderperformanceAlerts.map((a) => (
                  <li key={a.listingId}>
                    <strong>{a.title}</strong> — {a.note}
                  </li>
                ))
              }
            </ul>
          </section>

          <p className="text-xs text-slate-500">Bundle generated {new Date(data.generatedAt).toLocaleString()}</p>
        </>
      : null}
    </div>
  );
}
