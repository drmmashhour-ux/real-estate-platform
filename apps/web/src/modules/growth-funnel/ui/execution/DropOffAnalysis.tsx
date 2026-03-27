"use client";

import type { ExecutionSnapshot } from "@/src/modules/growth-funnel/application/computeExecutionTracking";

function dropOff(pct: number | null): number | null {
  if (pct == null) return null;
  return Math.round((100 - pct) * 100) / 100;
}

export function DropOffAnalysis({
  current,
  previous,
}: {
  current: ExecutionSnapshot;
  previous: ExecutionSnapshot;
}) {
  const steps = [
    { key: "l2s", label: "Landing → simulator", cur: current.flows.landingToSimulator, prev: previous.flows.landingToSimulator },
    { key: "s2s", label: "Simulator → save", cur: current.flows.simulatorToSave, prev: previous.flows.simulatorToSave },
    { key: "s2r", label: "Save → return", cur: current.flows.saveToReturn, prev: previous.flows.saveToReturn },
    { key: "r2u", label: "Return → upgrade click", cur: current.flows.returnToUpgrade, prev: previous.flows.returnToUpgrade },
  ];

  return (
    <div className="rounded-xl border border-white/10 bg-black/25 p-4">
      <h3 className="text-sm font-semibold text-white">Drop-off analysis</h3>
      <p className="mt-1 text-xs text-slate-500">
        Approximate drop-off at each step (100% − step conversion). Compare to prior window to spot friction.
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[32rem] text-left text-xs">
          <thead>
            <tr className="border-b border-white/10 text-slate-500">
              <th className="py-2 pr-3 font-medium">Step</th>
              <th className="py-2 pr-3 font-medium">Drop-off (now)</th>
              <th className="py-2 pr-3 font-medium">Drop-off (prior)</th>
              <th className="py-2 font-medium">Δ</th>
            </tr>
          </thead>
          <tbody className="text-slate-300">
            {steps.map((s) => {
              const dCur = dropOff(s.cur.conversionPercent);
              const dPrev = dropOff(s.prev.conversionPercent);
              const delta =
                dCur != null && dPrev != null ? Math.round((dCur - dPrev) * 100) / 100 : null;
              const worse = delta != null && delta > 0;
              return (
                <tr key={s.key} className="border-b border-white/5">
                  <td className="py-2 pr-3 text-slate-200">{s.label}</td>
                  <td className="py-2 pr-3 tabular-nums">{dCur == null ? "—" : `${dCur}%`}</td>
                  <td className="py-2 pr-3 tabular-nums">{dPrev == null ? "—" : `${dPrev}%`}</td>
                  <td className={`py-2 tabular-nums ${worse ? "text-amber-400" : "text-emerald-400/90"}`}>
                    {delta == null ? "—" : `${delta > 0 ? "+" : ""}${delta}%`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
