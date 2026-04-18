/**
 * Enterprise broker network view — tiers + performance + incentive hints (no payout changes).
 */

import { getBrokerPerformanceSummaries } from "./broker-performance.service";
import { listBrokerTierSummaries, type BrokerTierProfile } from "./broker-tier.service";

export type BrokerNetworkMember = BrokerTierProfile & {
  leadsPurchasedLifetime: number;
  moneySpentCadLifetime: number;
  incentiveHints: string[];
};

function incentiveHintsFor(row: {
  brokerTier: BrokerTierProfile["brokerTier"];
  monthlySpendCad: number;
  leadsPurchasedLifetime: number;
}): string[] {
  const hints: string[] = [];
  if (row.brokerTier === "elite") {
    hints.push("Offer exclusive preview of high-intent leads (operator-approved).");
    hints.push("Quarterly business review + co-marketing bundle.");
  } else if (row.brokerTier === "pro") {
    hints.push("Unlock volume tier review after consistent monthly spend.");
    hints.push("Priority onboarding for secondary market expansion.");
  } else {
    hints.push("Nudge upgrade path: Pro unlocks faster routing + allowances.");
    hints.push("First-purchase bonus messaging (manual campaigns only).");
  }
  if (row.leadsPurchasedLifetime >= 3 && row.monthlySpendCad < 80) {
    hints.push("LTV growth: bundle second-market training session.");
  }
  return hints;
}

export async function getBrokerNetworkOverview(limit = 30): Promise<BrokerNetworkMember[]> {
  const [tiers, perf] = await Promise.all([listBrokerTierSummaries(80), getBrokerPerformanceSummaries(80)]);
  const perfById = new Map(perf.map((p) => [p.userId, p]));

  const merged: BrokerNetworkMember[] = [];
  for (const t of tiers) {
    const p = perfById.get(t.userId);
    merged.push({
      ...t,
      leadsPurchasedLifetime: p?.leadsPurchased ?? 0,
      moneySpentCadLifetime: p?.moneySpentCad ?? 0,
      incentiveHints: incentiveHintsFor({
        brokerTier: t.brokerTier,
        monthlySpendCad: t.monthlySpendCad,
        leadsPurchasedLifetime: p?.leadsPurchased ?? 0,
      }),
    });
  }

  merged.sort((a, b) => b.monthlySpendCad - a.monthlySpendCad);
  return merged.slice(0, limit);
}
