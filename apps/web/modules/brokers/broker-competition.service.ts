import { getBrokerPerformanceSummaries } from "@/modules/growth/broker-performance.service";
import type { BrokerCompetitionProfile, BrokerCompetitionTier } from "./broker-competition.types";

const STALE_MS = 90 * 24 * 60 * 60 * 1000;

function tierFromSignals(input: {
  leadsPurchased: number;
  isVip: boolean;
  repeatPurchaseProxy: number;
  lastPurchaseAt: string | null;
}): BrokerCompetitionTier {
  const stale =
    !input.lastPurchaseAt || Date.now() - new Date(input.lastPurchaseAt).getTime() > STALE_MS;
  if (stale && input.leadsPurchased < 2) return "standard";
  if (input.isVip && input.leadsPurchased >= 8 && input.repeatPurchaseProxy >= 0.5) return "elite";
  if (input.isVip || input.leadsPurchased >= 3) return "preferred";
  return "standard";
}

/**
 * Read-only competition view from RevenueEvent-derived broker summaries — no writes, no auto-charge.
 */
export async function buildBrokerCompetitionProfiles(): Promise<BrokerCompetitionProfile[]> {
  const rows = await getBrokerPerformanceSummaries(40);
  if (rows.length === 0) return [];

  const maxLeads = Math.max(1, ...rows.map((r) => r.leadsPurchased));

  return rows.map((r) => {
    const activityScore = Math.round((r.leadsPurchased / maxLeads) * 100);
    const closeRate = Math.round(Math.min(1, 0.35 + r.repeatPurchaseProxy * 0.5 + r.leadsPurchased * 0.02) * 100) / 100;
    const responseTimeScore = Math.round(
      Math.min(100, 22 + r.leadsPurchased * 6 + r.repeatPurchaseProxy * 38 + (r.isVip ? 12 : 0)),
    );
    const tier = tierFromSignals({
      leadsPurchased: r.leadsPurchased,
      isVip: r.isVip,
      repeatPurchaseProxy: r.repeatPurchaseProxy,
      lastPurchaseAt: r.lastPurchaseAt,
    });

    return {
      brokerId: r.userId,
      responseTimeScore,
      closeRate,
      activityScore,
      tier,
    };
  });
}
