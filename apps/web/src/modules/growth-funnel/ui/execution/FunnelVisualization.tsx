"use client";

import type { ExecutionSnapshot } from "@/src/modules/growth-funnel/application/computeExecutionTracking";

export function FunnelVisualization({ snapshot }: { snapshot: ExecutionSnapshot }) {
  const steps = [
    snapshot.flows.landingToSimulator,
    snapshot.flows.simulatorToSave,
    snapshot.flows.saveToReturn,
    snapshot.flows.returnToUpgrade,
  ];

  return (
    <div className="rounded-xl border border-white/10 bg-black/25 p-4">
      <h3 className="text-sm font-semibold text-white">User flow (sequential, identified users)</h3>
      <p className="mt-1 text-xs text-slate-500">
        Each step counts users who completed the second event after the first, within the same time window.
      </p>
      <ol className="mt-4 space-y-3">
        {steps.map((s, i) => (
          <li key={s.label} className="flex flex-wrap items-start gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-premium-gold/20 text-xs font-semibold text-premium-gold">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-200">{s.label}</p>
              <p className="mt-0.5 text-xs text-slate-500">
                {s.completed} / {s.denominator} users
                {s.conversionPercent != null ? (
                  <span className="ml-2 text-slate-400">({s.conversionPercent}%)</span>
                ) : null}
              </p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-emerald-500/80"
                  style={{
                    width: `${Math.min(100, Math.max(0, s.conversionPercent ?? 0))}%`,
                  }}
                />
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
