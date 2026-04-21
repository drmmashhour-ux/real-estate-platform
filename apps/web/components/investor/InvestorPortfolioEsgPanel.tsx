import type { PortfolioEsgResult } from "@/modules/investor-esg/portfolio.types";

function riskStyles(level: PortfolioEsgResult["riskLevel"]) {
  switch (level) {
    case "HIGH":
      return "text-red-300 ring-red-500/40 bg-red-950/40";
    case "LOW":
      return "text-emerald-300 ring-emerald-500/35 bg-emerald-950/35";
    default:
      return "text-amber-200 ring-amber-500/35 bg-amber-950/35";
  }
}

/** Portfolio ESG snapshot — pairs with `runPortfolioEsgAnalysis` / ROI resilience hint */
export function InvestorPortfolioEsgPanel({
  result,
  scenarioTitle,
  sourceNote,
}: {
  result: PortfolioEsgResult;
  scenarioTitle?: string | null;
  /** e.g. illustrative ESG from scenario risk/fit when true scores unavailable */
  sourceNote?: string | null;
}) {
  const maxShare = Math.max(...result.distribution.map((d) => d.sharePct), 1);

  return (
    <section className="rounded-2xl border border-emerald-500/25 bg-[#0c1412]/90 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400/95">{result.positioning}</p>
          <h2 className="mt-2 text-lg font-semibold text-white">Portfolio ESG intelligence</h2>
          {scenarioTitle ? <p className="mt-1 text-xs text-slate-500">Scenario: {scenarioTitle}</p> : null}
          {sourceNote ? <p className="mt-1 text-[11px] text-slate-500">{sourceNote}</p> : null}
        </div>
        <div className={`rounded-xl px-4 py-3 ring-1 ${riskStyles(result.riskLevel)}`}>
          <p className="text-[10px] font-semibold uppercase tracking-wide opacity-90">Portfolio risk (ESG)</p>
          <p className="mt-1 text-xl font-bold">{result.riskLevel}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total portfolio ESG score</p>
          <p className="mt-2 font-serif text-4xl font-semibold text-emerald-100">{result.portfolioScore.toFixed(1)}</p>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-500">{result.disclaimer}</p>
          {result.illustrativeResilienceRoiHintPercent != null ? (
            <p className="mt-3 text-xs text-slate-400">
              Illustrative resilience ROI band (investment module tie-in):{" "}
              <span className="font-medium text-slate-200">
                ~{result.illustrativeResilienceRoiHintPercent.toFixed(1)}%
              </span>{" "}
              — not a forecast; see ROI calculator assumptions.
            </p>
          ) : null}
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Score distribution (by property)</p>
          <ul className="mt-3 space-y-2">
            {result.distribution.map((d) => (
              <li key={d.label} className="flex items-center gap-3 text-xs">
                <span className="w-16 shrink-0 text-slate-400">{d.label}</span>
                <div className="h-2 min-w-0 flex-1 rounded-full bg-white/10">
                  <div
                    className="h-2 rounded-full bg-emerald-500/70"
                    style={{ width: `${Math.min(100, (d.sharePct / maxShare) * 100)}%` }}
                  />
                </div>
                <span className="w-14 shrink-0 text-right tabular-nums text-slate-400">
                  {d.count} ({d.sharePct}%)
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 border-t border-white/10 pt-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Upgrade opportunities</p>
        {result.recommendations.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No major laggards modeled — maintain assets and documentation.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {result.recommendations.map((r) => (
              <li key={r.propertyId} className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-white">{r.label ?? r.propertyId}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                      r.priority === "HIGH"
                        ? "bg-red-500/20 text-red-200"
                        : r.priority === "MEDIUM"
                          ? "bg-amber-500/20 text-amber-100"
                          : "bg-slate-600/40 text-slate-300"
                    }`}
                  >
                    {r.priority}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-400">{r.action}</p>
                <p className="mt-2 text-[11px] text-emerald-200/90">
                  Expected portfolio uplift if asset reaches target band: ~+{r.expectedPortfolioImpactPoints.toFixed(1)} pts ·
                  Asset ESG gain (modeled): ~+{r.expectedAssetEsgGainPoints.toFixed(1)} pts
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
