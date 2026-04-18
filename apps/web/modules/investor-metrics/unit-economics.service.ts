import { computeLiveKpis, getMarketingAndGrowthInputs } from "@/src/modules/investor-metrics/metricsEngine";

/**
 * Unit economics — CAC from configured spend; LTV not inferred without finance model (returns null + disclaimer).
 */
export async function buildUnitEconomicsSnapshot(now = new Date()) {
  const [kpis, marketing] = await Promise.all([computeLiveKpis(now), getMarketingAndGrowthInputs(now)]);

  return {
    generatedAt: now.toISOString(),
    cacUsd: kpis.cac,
    marketingSpend30dUsd: marketing.marketingSpend30d,
    newUsers30d: marketing.newUsers30d,
    revenuePerActiveUser30d: kpis.revenuePerUser,
    ltvUsd: null as number | null,
    disclaimers: [
      "LTV is not auto-estimated — bring finance model + cohort revenue for board-ready LTV.",
      "CAC uses `INVESTOR_MARKETING_SPEND_30D` — must be maintained for accuracy.",
    ],
  };
}
