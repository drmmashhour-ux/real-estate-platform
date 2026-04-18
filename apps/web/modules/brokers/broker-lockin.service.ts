import { buildBrokerCompetitionProfiles } from "@/modules/brokers/broker-competition.service";
import { getBrokerPerformanceSummaries } from "@/modules/growth/broker-performance.service";
import type { BrokerLockInSignal } from "@/modules/brokers/broker-lockin.types";

function dependencyFromProfile(input: {
  activityScore: number;
  closeRate: number;
  responseTimeScore: number;
}): number {
  const a = Math.min(1, input.activityScore / 100) * 0.35;
  const c = Math.min(1, input.closeRate) * 0.35;
  const r = Math.min(1, input.responseTimeScore / 100) * 0.3;
  return Math.round((a + c + r) * 100) / 100;
}

/**
 * Read-only dependency view derived from the same monetization summaries as broker competition.
 * Not psychological manipulation — transparent indices for operators.
 */
export async function buildBrokerLockInSignals(): Promise<BrokerLockInSignal[]> {
  const [profiles, rows] = await Promise.all([
    buildBrokerCompetitionProfiles(),
    getBrokerPerformanceSummaries(40),
  ]);
  const byId = new Map(rows.map((r) => [r.userId, r]));

  return profiles.map((p) => {
    const row = byId.get(p.brokerId);
    const leads = row?.leadsPurchased ?? 0;
    const dependencyScore = dependencyFromProfile({
      activityScore: p.activityScore,
      closeRate: p.closeRate,
      responseTimeScore: p.responseTimeScore,
    });

    return {
      brokerId: p.brokerId,
      dependencyScore,
      tier: p.tier,
      factors: [
        `Leads received (platform monetization events counted): ${leads}`,
        row
          ? `Trailing spend proxy (CAD, revenue events): ${row.moneySpentCad}`
          : "Trailing spend proxy: —",
        `Response speed index: ${p.responseTimeScore}/100`,
        `Repeat-engagement proxy (not a guaranteed deal count): ${(p.closeRate * 100).toFixed(0)}%`,
        `Reliance on platform pipeline (activity index): ${p.activityScore}/100`,
        `Tier (competition routing): ${p.tier}`,
      ],
    };
  });
}
