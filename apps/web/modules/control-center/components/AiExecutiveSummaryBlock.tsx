"use client";

import type { AiControlCenterPayload } from "../ai-control-center.types";

const OVERALL: Record<
  AiControlCenterPayload["executiveSummary"]["overallStatus"],
  { label: string; className: string }
> = {
  healthy: { label: "Healthy", className: "bg-emerald-950/80 text-emerald-100" },
  limited: { label: "Limited", className: "bg-amber-950/80 text-amber-100" },
  warning: { label: "Warning", className: "bg-orange-950/80 text-orange-100" },
  critical: { label: "Critical", className: "bg-rose-950/90 text-rose-50" },
};

export function AiExecutiveSummaryBlock({ payload }: { payload: AiControlCenterPayload }) {
  const e = payload.executiveSummary;
  const badge = OVERALL[e.overallStatus];
  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Executive summary</h2>
          <p className="mt-1 text-xs text-zinc-500">Read-only — decision support only.</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${badge.className}`}>{badge.label}</span>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-3 text-center">
          <p className="text-2xl font-semibold text-zinc-100">{e.systemsHealthyCount}</p>
          <p className="text-[11px] text-zinc-500">Systems OK / disabled</p>
        </div>
        <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-3 text-center">
          <p className="text-2xl font-semibold text-amber-200/90">{e.systemsWarningCount}</p>
          <p className="text-[11px] text-zinc-500">Warning / limited</p>
        </div>
        <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-3 text-center">
          <p className="text-2xl font-semibold text-rose-200/90">{e.systemsCriticalCount}</p>
          <p className="text-[11px] text-zinc-500">Critical</p>
        </div>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div>
          <h3 className="text-xs font-medium text-zinc-400">Top opportunities</h3>
          <ul className="mt-2 space-y-1 text-sm text-zinc-300">
            {(e.topOpportunities.length ? e.topOpportunities : ["—"]).slice(0, 3).map((x) => (
              <li key={x} className="border-b border-zinc-800/60 pb-1">
                {x}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-xs font-medium text-zinc-400">Top risks</h3>
          <ul className="mt-2 space-y-1 text-sm text-zinc-300">
            {(e.topRisks.length ? e.topRisks : ["—"]).slice(0, 3).map((x) => (
              <li key={x} className="border-b border-zinc-800/60 pb-1">
                {x}
              </li>
            ))}
          </ul>
        </div>
      </div>
      {e.criticalWarnings.length > 0 ? (
        <div className="mt-5">
          <h3 className="text-xs font-medium text-rose-300/90">Critical / unified warnings</h3>
          <ul className="mt-2 max-h-32 overflow-y-auto text-xs text-rose-100/90">
            {e.criticalWarnings.map((w) => (
              <li key={w} className="border-b border-zinc-800/40 py-0.5">
                {w}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
