/**
 * Broker competition vs prior-window monetization proxies — correlation-style only.
 */

import { prisma } from "@/lib/db";
import { buildBrokerCompetitionProfiles } from "@/modules/brokers/broker-competition.service";
import { bandBrokerProxy, BROKER_WINDOW_MIN_EVENTS } from "@/modules/growth/growth-execution-results-bands";
import type { BrokerCompetitionOutcome } from "@/modules/growth/growth-execution-results.types";

const LEAD_EVENTS = ["lead_unlock", "lead_purchased"] as const;

async function countPurchases(userId: string, since: Date, until: Date): Promise<number> {
  return prisma.revenueEvent.count({
    where: {
      userId,
      eventType: { in: [...LEAD_EVENTS] },
      amount: { gt: 0 },
      createdAt: { gte: since, lt: until },
    },
  });
}

export async function buildBrokerCompetitionResults(windowDays: number): Promise<BrokerCompetitionOutcome[]> {
  const measuredAt = new Date().toISOString();
  const until = new Date();
  const mid = new Date(until.getTime() - windowDays * 86400000);
  const since = new Date(until.getTime() - 2 * windowDays * 86400000);

  const profiles = await buildBrokerCompetitionProfiles();
  const limited = profiles.slice(0, 15);
  const out: BrokerCompetitionOutcome[] = [];

  for (const p of limited) {
    const recent = await countPurchases(p.brokerId, mid, until);
    const prior = await countPurchases(p.brokerId, since, mid);
    const leadActivityDelta = recent - prior;
    const closeSignalDelta =
      recent + prior > 0 ? Math.round((recent / Math.max(1, prior) - 1) * 100) / 100 : undefined;

    const outcomeBand = bandBrokerProxy({
      leadEventsRecent: recent,
      leadEventsPrior: prior,
      tier: p.tier,
    });

    const sparse = recent + prior < BROKER_WINDOW_MIN_EVENTS;

    let explanation =
      `Monetization event delta (recent − prior ${windowDays}d windows) = ${leadActivityDelta}. Tier is an internal composite — not causal proof of quality.`;

    if (sparse) {
      explanation = `Sparse monetization events for this broker in the two windows (${recent + prior} total) — delta is unreliable.`;
    }

    out.push({
      brokerId: p.brokerId,
      tier: p.tier,
      score: p.activityScore,
      measuredAt,
      leadActivityDelta,
      closeSignalDelta,
      outcomeBand: sparse ? "insufficient_data" : outcomeBand,
      explanation,
    });
  }

  return out;
}
