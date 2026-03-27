"use client";

import type { FlowRunResult } from "@/src/modules/system-validation/types";

type Props = {
  flows: FlowRunResult[];
};

export function FlowStatusPanel({ flows }: Props) {
  if (!flows.length) {
    return (
      <section className="rounded-xl border border-slate-700 bg-slate-900/40 p-4">
        <h2 className="text-lg font-semibold text-slate-100">Flow status</h2>
        <p className="mt-2 text-sm text-slate-500">No run yet.</p>
      </section>
    );
  }
  return (
    <section className="rounded-xl border border-slate-700 bg-slate-900/40 p-4">
      <h2 className="text-lg font-semibold text-slate-100">Flow status</h2>
      <ul className="mt-3 space-y-2 text-sm">
        {flows.map((f) => (
          <li
            key={`${f.flowId}-${f.durationMs}`}
            className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-800/80 py-2 last:border-0"
          >
            <span className={f.ok ? "text-emerald-300" : "text-red-300"}>{f.ok ? "✓" : "✗"}</span>
            <span className="flex-1 font-mono text-xs text-slate-300">{f.flowId}</span>
            <span className="text-slate-500">{Math.round(f.durationMs)}ms</span>
            {f.detail ? <span className="w-full text-xs text-slate-500">{f.detail}</span> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
