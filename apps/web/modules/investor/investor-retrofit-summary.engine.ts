import type { InvestorListingContext } from "@/modules/investor/investor-context.loader";

export function buildRetrofitSummaryText(ctx: InvestorListingContext): {
  planType: string | null;
  topActions: string[];
  costBand: string | null;
  impactBand: string | null;
  timelineBand: string | null;
  financingFit: string | null;
} {
  const p = ctx.retrofitPlan;
  if (!p) {
    return {
      planType: null,
      topActions: [],
      costBand: null,
      impactBand: null,
      timelineBand: null,
      financingFit: ctx.retrofitScenarioLatest?.financingFit ?? null,
    };
  }

  const topActions = p.actions.slice(0, 5).map((a) => `Phase ${a.phase}: ${a.title} (${a.impactBand ?? "impact TBD"})`);

  return {
    planType: `${p.strategyType} — ${p.planName}`,
    topActions,
    costBand: p.totalEstimatedCostBand,
    impactBand: p.totalEstimatedImpactBand,
    timelineBand: p.totalTimelineBand,
    financingFit: ctx.retrofitScenarioLatest?.financingFit ?? null,
  };
}
