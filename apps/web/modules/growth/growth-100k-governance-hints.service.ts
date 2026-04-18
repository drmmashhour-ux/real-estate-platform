/**
 * Advisory governance hints for $100K ops layer — does not mutate policy enforcement records.
 */

import { prisma } from "@/lib/db";
import { getAdvancedRecommendedLeadPriceCad } from "./marketplace-dynamic-pricing-advanced.service";
import { PRICING_CONFIG } from "@/modules/revenue/pricing-config";
import { getBrokerLifecycleSnapshots } from "./lifecycle.service";

export type Growth100kGovernanceHints = {
  overpricingRisk: string | null;
  lowQualityLeadSignals: string[];
  brokerChurnSummary: string | null;
  freezeOrAdjust: string[];
};

export async function getGrowth100kGovernanceHints(): Promise<Growth100kGovernanceHints> {
  const adv = await getAdvancedRecommendedLeadPriceCad();
  const anchor = PRICING_CONFIG.canada.lead.default;
  let overpricingRisk: string | null = null;
  if (adv.recommendedPriceCad > anchor * 1.35) {
    overpricingRisk = `Suggested advanced price ($${adv.recommendedPriceCad.toFixed(2)}) is well above default anchor ($${anchor}) — review unlock conversion before raising live prices.`;
  }

  const recentLeads = await prisma.lead.findMany({
    where: { createdAt: { gte: new Date(Date.now() - 7 * 86_400_000) } },
    select: { score: true },
    take: 500,
  });
  const lowScores = recentLeads.filter((l) => l.score < 28).length;
  const lowQualityLeadSignals: string[] = [];
  if (recentLeads.length >= 15 && lowScores / recentLeads.length > 0.35) {
    lowQualityLeadSignals.push("High share of low CRM scores in last 7d — tighten intake or routing.");
  }

  const life = await getBrokerLifecycleSnapshots(60);
  const atRiskCount = life.filter((l) => l.churnRisk === "high" || l.stage === "at_risk").length;

  const brokerChurnSummary =
    atRiskCount > 5
      ? `${atRiskCount} brokers show elevated churn risk — review cohort + win-back (advisory).`
      : null;

  const freezeOrAdjust: string[] = [];
  if (overpricingRisk) freezeOrAdjust.push("Freeze default price increases until conversion stabilizes.");
  if (lowQualityLeadSignals.length) freezeOrAdjust.push("Adjust acquisition targeting / form validation for quality.");
  if (brokerChurnSummary) freezeOrAdjust.push("Prioritize broker retention plays before scaling paid traffic.");

  return {
    overpricingRisk,
    lowQualityLeadSignals,
    brokerChurnSummary,
    freezeOrAdjust,
  };
}
