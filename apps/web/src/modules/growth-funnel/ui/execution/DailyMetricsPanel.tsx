"use client";

import type { ExecutionSnapshot } from "@/src/modules/growth-funnel/application/computeExecutionTracking";

function pct(v: number | null) {
  if (v == null) return "—";
  return `${v}%`;
}

export function DailyMetricsPanel({ snapshot }: { snapshot: ExecutionSnapshot }) {
  const rows: { label: string; value: string; hint?: string }[] = [
    { label: "New users", value: String(snapshot.newUsers), hint: "Accounts created in window" },
    { label: "Simulator runs", value: String(snapshot.simulatorRuns), hint: "Total simulator_used events" },
    { label: "Activation rate", value: pct(snapshot.activationRate), hint: "first_action ÷ signup_started" },
    { label: "Return users", value: String(snapshot.returnUsers), hint: "Distinct return_visit" },
    { label: "Retention rate", value: pct(snapshot.retentionRate), hint: "return ÷ simulator users" },
    { label: "Conversion rate", value: pct(snapshot.conversionRate), hint: "upgrade_completed ÷ upgrade_clicked" },
  ];

  return (
    <div className="rounded-xl border border-white/10 bg-black/25 p-4">
      <h3 className="text-sm font-semibold text-white">Daily execution metrics</h3>
      <p className="mt-1 text-xs text-slate-500">
        Current window ({snapshot.windowDays}d, UTC). Comparable to prior window in the report below.
      </p>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((r) => (
          <div key={r.label} className="rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2">
            <dt className="text-xs text-slate-500">{r.label}</dt>
            <dd className="mt-1 text-lg font-semibold tabular-nums text-white">{r.value}</dd>
            {r.hint ? <p className="mt-0.5 text-[10px] text-slate-600">{r.hint}</p> : null}
          </div>
        ))}
      </dl>
    </div>
  );
}
