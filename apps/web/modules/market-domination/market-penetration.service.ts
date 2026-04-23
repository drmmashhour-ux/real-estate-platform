import type { HubPenetrationResult, HubType, PenetrationBand, TerritoryMetrics } from "./market-domination.types";

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function bandFromScore(score: number): PenetrationBand {
  if (score < 0.28) return "LOW";
  if (score < 0.52) return "MEDIUM";
  if (score < 0.78) return "HIGH";
  return "DOMINANT";
}

/** Proxy scores from metrics — coarse heuristics, explicitly explainable */
export function computeHubPenetration(m: TerritoryMetrics): HubPenetrationResult[] {
  const hubs: HubType[] = ["BUYER", "SELLER", "BROKER", "BNHUB", "INVESTOR", "RESIDENCE"];

  const buyerScore = clamp01(
    0.35 * clamp01(m.buyerDemand / 120) +
      0.25 * clamp01(m.listingsCount / 400) +
      0.25 * m.conversionRate +
      0.15 * clamp01(m.activeUsers / 800)
  );

  const sellerScore = clamp01(
    0.45 * clamp01(m.listingsCount / 350) +
      0.35 * clamp01(m.activeBrokers / 80) +
      0.2 * clamp01(m.leadVolume / 200)
  );

  const brokerScore = clamp01(
    0.5 * clamp01(m.activeBrokers / 60) +
      0.35 * clamp01(m.leadVolume / 250) +
      0.15 * m.conversionRate
  );

  const bnhubScore = clamp01(
    0.45 * clamp01(m.bnhubSupply / 120) +
      0.4 * clamp01(m.bookingVolume / 400) +
      0.15 * clamp01(m.activeUsers / 600)
  );

  const investorScore = clamp01(
    0.55 * clamp01(m.investorActivity / 80) +
      0.25 * clamp01(m.leadVolume / 180) +
      0.2 * clamp01(m.revenueCents / 500_000_000)
  );

  const residenceScore = clamp01(
    0.5 * clamp01(m.residenceServicesSupply / 90) +
      0.35 * clamp01(m.renterDemand / 100) +
      0.15 * clamp01(m.bookingVolume / 300)
  );

  const defs: Record<HubType, { score: number; metrics: string[] }> = {
    BUYER: {
      score: buyerScore,
      metrics: ["buyerDemand", "listingsCount", "conversionRate"],
    },
    SELLER: {
      score: sellerScore,
      metrics: ["listingsCount", "activeBrokers", "leadVolume"],
    },
    BROKER: {
      score: brokerScore,
      metrics: ["activeBrokers", "leadVolume"],
    },
    BNHUB: {
      score: bnhubScore,
      metrics: ["bnhubSupply", "bookingVolume"],
    },
    INVESTOR: {
      score: investorScore,
      metrics: ["investorActivity", "leadVolume"],
    },
    RESIDENCE: {
      score: residenceScore,
      metrics: ["residenceServicesSupply", "renterDemand"],
    },
  };

  return hubs.map((hub) => {
    const d = defs[hub];
    return {
      hub,
      score: d.score,
      band: bandFromScore(d.score),
      supportingMetrics: d.metrics.map((k) => `${k} contributes to ${hub} penetration proxy`),
    };
  });
}
