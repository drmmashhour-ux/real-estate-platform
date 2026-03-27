"use client";

import type { PerformanceSample } from "@/src/modules/system-validation/types";

type Props = {
  samples: PerformanceSample[];
  scaling?: { concurrentTasks: number; totalDurationMs: number; failures: number; p95Ms?: number };
};

export function PerformanceMetricsPanel({ samples, scaling }: Props) {
  return (
    <section className="rounded-xl border border-slate-700 bg-slate-900/40 p-4">
      <h2 className="text-lg font-semibold text-slate-100">Performance</h2>
      {scaling ? (
        <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <Metric label="Scaling concurrency" value={String(scaling.concurrentTasks)} />
          <Metric label="Scaling wall time" value={`${Math.round(scaling.totalDurationMs)} ms`} />
          <Metric label="Scaling failures" value={String(scaling.failures)} />
          <Metric label="P95 (simulator tasks)" value={scaling.p95Ms != null ? `${Math.round(scaling.p95Ms)} ms` : "—"} />
        </div>
      ) : (
        <p className="mt-2 text-sm text-slate-500">No scaling probe in last run.</p>
      )}
      <h3 className="mt-4 text-sm font-medium text-slate-300">Per-step timings</h3>
      <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-xs font-mono text-slate-400">
        {samples.map((s, i) => (
          <li key={i} className={s.slow ? "text-amber-300" : ""}>
            {s.label}: {Math.round(s.durationMs)}ms{s.slow ? " (slow)" : ""}
          </li>
        ))}
      </ul>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-950/50 px-3 py-2">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-slate-200">{value}</div>
    </div>
  );
}
