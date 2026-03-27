import type { ScenarioSummaryDto } from "@/modules/deal-analyzer/domain/contracts";

export function ScenarioSimulatorCard({ scenarios }: { scenarios: ScenarioSummaryDto[] }) {
  if (scenarios.length === 0) return null;

  const rental = scenarios.filter((s) => s.scenarioMode === "rental" || s.scenarioMode == null);
  const bnhub = scenarios.filter((s) => s.scenarioMode === "bnhub");

  return (
    <div className="rounded-2xl border border-white/10 bg-[#121212] p-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#C9A646]">Scenario simulator</p>
      <p className="mt-1 text-xs text-slate-500">
        Illustrative rules-based projections — not market rent comps or guaranteed revenue.
      </p>

      {rental.length > 0 ? (
        <div className="mt-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Long-term rental</p>
          <div className="mt-2 grid gap-3 sm:grid-cols-3">
            {rental.map((s) => (
              <div key={`rental-${s.scenarioType}`} className="rounded-xl border border-white/10 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{s.scenarioType}</p>
                <p className="mt-2 text-sm text-white">
                  Cash flow (mo):{" "}
                  {s.monthlyCashFlow != null ? `$${(s.monthlyCashFlow / 100).toFixed(0)}` : "—"}
                </p>
                <p className="text-xs text-slate-400">
                  ROI (ann.): {s.annualRoiPercent != null ? `${s.annualRoiPercent.toFixed(1)}%` : "—"}
                </p>
                {s.mortgageUnavailableReason ? (
                  <p className="mt-2 text-[11px] text-slate-500">{s.mortgageUnavailableReason}</p>
                ) : null}
                {s.warnings[0] ? <p className="mt-2 text-[11px] text-amber-200/80">{s.warnings[0]}</p> : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {bnhub.length > 0 ? (
        <div className="mt-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-200/80">Short-term (BNHub)</p>
          <div className="mt-2 grid gap-3 sm:grid-cols-3">
            {bnhub.map((s) => (
              <div key={`bnhub-${s.scenarioType}`} className="rounded-xl border border-cyan-500/20 bg-cyan-500/[0.03] p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{s.scenarioType}</p>
                <p className="mt-2 text-sm text-white">
                  Net (mo est.):{" "}
                  {s.monthlyNetOperatingCents != null
                    ? `$${(s.monthlyNetOperatingCents / 100).toFixed(0)}`
                    : s.monthlyCashFlow != null
                      ? `$${(s.monthlyCashFlow / 100).toFixed(0)}`
                      : "—"}
                </p>
                <p className="text-xs text-slate-400">
                  Gross (mo):{" "}
                  {s.monthlyGrossRevenueCents != null
                    ? `$${(s.monthlyGrossRevenueCents / 100).toFixed(0)}`
                    : "—"}
                </p>
                {s.warnings[0] ? <p className="mt-2 text-[11px] text-amber-200/80">{s.warnings[0]}</p> : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
