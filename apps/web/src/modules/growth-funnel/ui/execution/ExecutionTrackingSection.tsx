"use client";

import { useEffect, useState } from "react";
import type { ExecutionTrackingPayload } from "@/src/modules/growth-funnel/application/computeExecutionTracking";
import { DailyMetricsPanel } from "@/src/modules/growth-funnel/ui/execution/DailyMetricsPanel";
import { DropOffAnalysis } from "@/src/modules/growth-funnel/ui/execution/DropOffAnalysis";
import { FunnelVisualization } from "@/src/modules/growth-funnel/ui/execution/FunnelVisualization";

export function ExecutionTrackingSection() {
  const [data, setData] = useState<ExecutionTrackingPayload | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/execution-tracking?days=30")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setErr(d.error);
        else setData(d);
      })
      .catch(() => setErr("Failed to load"));
  }, []);

  if (err) {
    return <p className="text-sm text-red-400">{err}</p>;
  }

  if (!data) {
    return <p className="text-sm text-slate-500">Loading execution metrics…</p>;
  }

  return (
    <div className="space-y-6">
      {data.alerts.length > 0 ? (
        <div className="rounded-xl border border-amber-500/35 bg-amber-950/30 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-400/90">Alerts</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-amber-100/90">
            {data.alerts.map((a) => (
              <li key={a.metric}>{a.message}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-xs text-slate-500">No threshold alerts on activation, retention, or conversion vs prior window.</p>
      )}

      <DailyMetricsPanel snapshot={data.current} />

      <div className="grid gap-6 lg:grid-cols-2">
        <FunnelVisualization snapshot={data.current} />
        <DropOffAnalysis current={data.current} previous={data.previous} />
      </div>

      <div className="rounded-xl border border-white/10 bg-black/25 p-4">
        <h3 className="text-sm font-semibold text-white">Daily report (last vs prior window)</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-xs font-medium uppercase text-emerald-400/90">What worked</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-slate-400">
              {data.report.whatWorked.map((x, i) => (
                <li key={`w-${i}`}>{x}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-slate-400">What didn&apos;t</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-slate-400">
              {data.report.whatDidnt.map((x, i) => (
                <li key={`d-${i}`}>{x}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-amber-400/90">What to improve</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-slate-400">
              {data.report.whatToImprove.map((x, i) => (
                <li key={`i-${i}`}>{x}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/20 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">New users &amp; runs (7–14d)</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {data.daily.map((d) => (
            <div
              key={d.date}
              className="rounded border border-white/5 bg-white/[0.02] px-2 py-1 text-[10px] text-slate-400"
              title={`${d.date}: ${d.newUsers} new users, ${d.simulatorRuns} runs`}
            >
              <span className="font-mono text-slate-300">{d.date.slice(5)}</span>
              <span className="ml-1 text-slate-500">
                {d.newUsers}u / {d.simulatorRuns}r
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
