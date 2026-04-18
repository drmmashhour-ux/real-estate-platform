"use client";

import type { FunnelReport } from "@/modules/growth-funnel/funnel.types";

function Bar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.round((100 * value) / max)) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-slate-400">
        <span>{label}</span>
        <span className="tabular-nums text-slate-300">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded bg-slate-800">
        <div
          className="h-full rounded bg-gradient-to-r from-violet-600 to-fuchsia-500 transition-[width]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function FunnelChart({ report, title }: { report: FunnelReport; title: string }) {
  const max = Math.max(1, ...report.steps.map((s) => s.count));

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
        <span className="text-xs text-slate-500">
          {report.funnelId} · {report.windowDays}d
          {report.conversionRate != null ? ` · end-to-end ${report.conversionRate}%` : ""}
        </span>
      </div>
      <div className="space-y-3">
        {report.steps.map((s) => (
          <Bar key={s.key} label={s.label} value={s.count} max={max} />
        ))}
      </div>
      {report.dropoffPoints.length > 0 ? (
        <p className="mt-3 text-xs text-amber-200/90">
          Drop-offs: {report.dropoffPoints.map((d) => `${d.from}→${d.to}`).join(", ")}
        </p>
      ) : null}
    </div>
  );
}
