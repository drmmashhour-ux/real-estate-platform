import type { MarketplaceFlywheelInsight } from "@/modules/marketplace/flywheel.types";
import type { FlywheelLearningSummary } from "@/modules/growth/flywheel-learning.service";

function impactStyle(impact: MarketplaceFlywheelInsight["impact"]): string {
  if (impact === "high") return "border-rose-500/35 bg-rose-950/20 text-rose-100";
  if (impact === "medium") return "border-amber-500/35 bg-amber-950/20 text-amber-100";
  return "border-slate-600/40 bg-slate-950/40 text-slate-300";
}

function typeLabel(t: MarketplaceFlywheelInsight["type"]): string {
  switch (t) {
    case "supply_gap":
      return "Supply gap";
    case "demand_gap":
      return "Demand gap";
    case "conversion_opportunity":
      return "Conversion";
    case "broker_gap":
      return "Broker gap";
    case "pricing_opportunity":
      return "Pricing (advisory)";
    default:
      return t;
  }
}

export function MarketplaceFlywheelPanel({
  insights,
  actions,
  priorities,
  learningSummary,
}: {
  insights: MarketplaceFlywheelInsight[];
  actions: string[];
  /** Same as sorted insights — explicit priority order for UI. */
  priorities: MarketplaceFlywheelInsight[];
  /** Historical action/outcome evidence — optional when tracking flags off. */
  learningSummary?: FlywheelLearningSummary | null;
}) {
  return (
    <section className="rounded-2xl border border-cyan-500/25 bg-[#0a1214] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300/90">Marketplace</p>
          <h2 className="mt-1 text-lg font-semibold text-white">Flywheel insights (V1)</h2>
          <p className="mt-1 max-w-2xl text-xs text-slate-400">
            Advisory signals from 30-day CRM and listing aggregates — does not run campaigns, spend budget, or change
            pricing automatically. Prioritize manually.
          </p>
        </div>
      </div>

      {priorities.length > 0 ? (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Priority order</p>
          <ol className="mt-2 list-inside list-decimal text-sm text-slate-300">
            {priorities.map((p) => (
              <li key={p.id}>
                <span className="font-medium text-white">{p.title}</span>
                <span className="text-slate-500"> — {p.impact} impact</span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      <div className="mt-5 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Insights</p>
        {insights.length === 0 ? (
          <p className="text-sm text-slate-500">No flywheel flags at this snapshot — metrics are in range or data is thin.</p>
        ) : (
          <ul className="space-y-3">
            {insights.map((ins) => (
              <li
                key={ins.id}
                className={`rounded-xl border px-4 py-3 text-sm ${impactStyle(ins.impact)}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold">{ins.title}</span>
                  <span className="text-[10px] uppercase tracking-wide opacity-80">
                    {typeLabel(ins.type)} · {ins.impact}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed opacity-95">{ins.description}</p>
                {learningSummary?.byInsightType[ins.type] ? (
                  <div className="mt-3 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[11px] text-slate-400">
                    <p className="font-semibold text-slate-300">Evidence (tracked actions)</p>
                    <p className="mt-1">
                      Similar actions recorded:{" "}
                      <span className="text-white">{learningSummary.byInsightType[ins.type]!.similarActionsCount}</span> ·
                      Completed (status):{" "}
                      <span className="text-white">{learningSummary.byInsightType[ins.type]!.completedActionsCount}</span>
                    </p>
                    <p className="mt-1">
                      Success rate (positive / scored outcomes):{" "}
                      {learningSummary.byInsightType[ins.type]!.successRate != null ? (
                        <span className="text-white">
                          {(learningSummary.byInsightType[ins.type]!.successRate * 100).toFixed(0)}%
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                      <span className="text-slate-600">
                        {" "}
                        · confidence{" "}
                        <span className="text-slate-400">{learningSummary.byInsightType[ins.type]!.confidence}</span>
                      </span>
                    </p>
                    {learningSummary.byInsightType[ins.type]!.lastOutcomeExplanation ? (
                      <p className="mt-2 border-t border-white/5 pt-2 text-[10px] leading-relaxed text-slate-500">
                        Last outcome snapshot:{" "}
                        <span className="text-slate-400">{learningSummary.byInsightType[ins.type]!.lastOutcomeScore}</span>
                        {" — "}
                        {learningSummary.byInsightType[ins.type]!.lastOutcomeExplanation}
                      </p>
                    ) : (
                      <p className="mt-2 text-[10px] text-slate-600">No outcome evaluations yet for this insight family.</p>
                    )}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      {actions.length > 0 ? (
        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Suggested actions (manual review)</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-300">
            {actions.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
