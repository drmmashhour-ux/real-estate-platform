import type {
  BudgetReallocationRecommendation,
  CampaignPortfolioInput,
  PortfolioCampaignScore,
} from "./portfolio-optimization.types";

const MAX_REALLOCATION_FROM_ONE_CAMPAIGN = 0.25;
const MAX_REALLOCATION_TO_ONE_CAMPAIGN = 0.3;
const MIN_SPEND_FLOOR = 20;

/**
 * Conservative pairwise shifts — manual execution only; caps prevent single-destination hogging.
 */
export function buildBudgetReallocationPlan(input: {
  campaigns: CampaignPortfolioInput[];
  scored: PortfolioCampaignScore[];
}): BudgetReallocationRecommendation[] {
  const recommendations: BudgetReallocationRecommendation[] = [];

  const scoreMap = new Map(input.scored.map((s) => [s.campaignKey, s]));
  const top = input.campaigns
    .filter(
      (c) =>
        ["PROFITABLE", "BREAKEVEN"].includes(c.profitabilityStatus ?? "") &&
        (scoreMap.get(c.campaignKey)?.qualityLabel === "TOP" || scoreMap.get(c.campaignKey)?.qualityLabel === "GOOD"),
    )
    .sort(
      (a, b) =>
        (scoreMap.get(b.campaignKey)?.portfolioScore ?? 0) - (scoreMap.get(a.campaignKey)?.portfolioScore ?? 0),
    );

  const weak = input.campaigns
    .filter((c) => scoreMap.get(c.campaignKey)?.qualityLabel === "WEAK" && (c.confidenceScore ?? 0) >= 0.55)
    .sort(
      (a, b) =>
        (scoreMap.get(a.campaignKey)?.portfolioScore ?? 0) - (scoreMap.get(b.campaignKey)?.portfolioScore ?? 0),
    );

  if (!top.length || !weak.length) return recommendations;

  /** Round-robin destinations so one winner does not absorb everything. */
  let destIdx = 0;
  const receivedByDest = new Map<string, number>();

  for (const from of weak) {
    if (!top.length) break;

    const maxTake = Math.max(0, Math.min(from.spend * MAX_REALLOCATION_FROM_ONE_CAMPAIGN, from.spend - MIN_SPEND_FLOOR));
    if (maxTake <= 0) continue;

    const to = top[destIdx % top.length];
    destIdx += 1;

    const alreadyTo = receivedByDest.get(to.campaignKey) ?? 0;
    const capTo = to.spend * MAX_REALLOCATION_TO_ONE_CAMPAIGN;
    const maxGive = Math.max(0, capTo - alreadyTo);
    const amount = Number(Math.min(maxTake, maxGive).toFixed(2));
    if (amount <= 0) continue;

    receivedByDest.set(to.campaignKey, alreadyTo + amount);

    recommendations.push({
      fromCampaignKey: from.campaignKey,
      toCampaignKey: to.campaignKey,
      fromAmount: amount,
      toAmount: amount,
      amount,
      confidenceScore: Number(
        Math.min(from.confidenceScore ?? 0.4, to.confidenceScore ?? 0.4, 0.85).toFixed(2),
      ),
      reason: `Shift budget from weaker campaign ${from.campaignKey} to stronger campaign ${to.campaignKey} based on portfolio score and profitability.`,
      safeguards: [
        "Manual review required in Ads Manager — LECIPM does not change budgets.",
        "Do not exceed per-campaign reallocation caps.",
        "Maintain minimum spend floor on source campaign.",
        "LTV figures are estimates until wired to realized revenue.",
      ],
    });
  }

  return recommendations;
}
