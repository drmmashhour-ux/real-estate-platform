import { DEFAULT_DOMINATION_WEIGHTS } from "./market-domination.config";
import type {
  HubPenetrationResult,
  StrategicRecommendation,
  Territory,
  TerritoryDomination,
  TerritoryExplainability,
} from "./market-domination.types";

export function explainTerritoryScore(
  territory: Territory,
  domination: TerritoryDomination,
  penetration: HubPenetrationResult[],
  contributingWeights = DEFAULT_DOMINATION_WEIGHTS
): TerritoryExplainability {
  const m = territory.metrics;
  const drivers: string[] = [];
  const weakeners: string[] = [];

  drivers.push(`Revenue/booking proxies weigh ~${Math.round(contributingWeights.revenueContribution * 100)}%`);
  if (penetration.some((p) => p.band === "HIGH" || p.band === "DOMINANT")) {
    drivers.push("At least one hub shows HIGH/DOMINANT penetration bands");
  }
  if (m.growthRate > 0.04) drivers.push("Positive growth momentum signal");

  if (m.supplyDemandRatio < 0.9) weakeners.push("Demand exceeds supply proxy — fulfillment risk");
  if (m.conversionRate < 0.14) weakeners.push("Conversion below typical healthy band for this demand level");
  if (domination.trend === "down") weakeners.push("Domination trend flagged as down — investigate leakage");

  const hubOrder = [...penetration].sort((a, b) => b.score - a.score);
  const leadingHub = hubOrder[0]?.hub ?? "BUYER";

  const whyActNow =
    domination.score >= 62
      ? "Maintain momentum: reinforce leading hub and shore up weakest penetration lane."
      : domination.score >= 42
        ? "Push structured experiments on top gap while stabilizing ops coverage."
        : "Focus on supply + routing fundamentals before scaling acquisition.";

  return {
    territoryId: territory.id,
    scoreDrivers: drivers,
    weakeners,
    whyActNow,
    leadingHub,
  };
}

export function explainRecommendation(rec: StrategicRecommendation): string {
  return `${rec.action} — targeting ${rec.targetHub} in territory focus. Expected impact ${rec.expectedImpact}, urgency ${rec.urgency}. Confidence reflects qualitative inputs only (${rec.confidence.toFixed(2)}).`;
}
