/**
 * Scale targets vs aggregate CRM / revenue snapshots — advisory only.
 */

import { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { buildScalePlan } from "@/modules/growth/scale-system.service";
import { bandScaleDelta } from "@/modules/growth/growth-execution-results-bands";
import type { ScaleSystemOutcome } from "@/modules/growth/growth-execution-results.types";

async function sumRevenueCad(since: Date, until: Date): Promise<number> {
  const agg = await prisma.revenueEvent.aggregate({
    where: {
      createdAt: { gte: since, lt: until },
      amount: { gt: 0 },
    },
    _sum: { amount: true },
  });
  return Math.round(((agg._sum.amount ?? 0) as number) * 100) / 100;
}

async function countLeadsCreated(since: Date, until: Date): Promise<number> {
  return prisma.lead.count({
    where: { createdAt: { gte: since, lt: until } },
  });
}

/** New broker-role signups in range (proxy for acquisition). */
async function countNewBrokers(since: Date, until: Date): Promise<number> {
  return prisma.user.count({
    where: {
      role: PlatformRole.BROKER,
      createdAt: { gte: since, lt: until },
    },
  });
}

export async function buildScaleSystemResults(windowDays: number): Promise<ScaleSystemOutcome[]> {
  const measuredAt = new Date().toISOString();
  const until = new Date();
  const mid = new Date(until.getTime() - windowDays * 86400000);
  const since = new Date(until.getTime() - 2 * windowDays * 86400000);

  const { plan } = buildScalePlan();

  const leadsCur = await countLeadsCreated(mid, until);
  const leadsPrev = await countLeadsCreated(since, mid);
  const revCur = await sumRevenueCad(mid, until);
  const revPrev = await sumRevenueCad(since, mid);
  const brokersCur = await countNewBrokers(mid, until);
  const brokersPrev = await countNewBrokers(since, mid);

  const leadGapNow = plan.requiredLeads - leadsCur;
  const leadGapPrev = plan.requiredLeads - leadsPrev;
  const revGapNow = plan.revenueTarget - revCur;
  const revGapPrev = plan.revenueTarget - revPrev;
  const brokerTarget = plan.brokerCount;
  const broGapNow = brokerTarget - brokersCur;
  const broGapPrev = brokerTarget - brokersPrev;

  const metrics: ScaleSystemOutcome[] = [
    {
      measuredAt,
      targetType: "leads",
      currentValue: leadsCur,
      previousValue: leadsPrev,
      delta: leadsCur - leadsPrev,
      gapChange: leadGapNow - leadGapPrev,
      outcomeBand: bandScaleDelta({
        delta: leadsCur - leadsPrev,
        targetType: "leads",
        priorValue: leadsPrev,
        currentValue: leadsCur,
      }),
      explanation: `Leads created: last ${windowDays}d vs prior ${windowDays}d. gapChange = (target−current)−(target−prior) for plan target ${plan.requiredLeads}. Not causal to any single Growth panel.`,
    },
    {
      measuredAt,
      targetType: "brokers",
      currentValue: brokersCur,
      previousValue: brokersPrev,
      delta: brokersCur - brokersPrev,
      gapChange: broGapNow - broGapPrev,
      outcomeBand: bandScaleDelta({
        delta: brokersCur - brokersPrev,
        targetType: "brokers",
        priorValue: brokersPrev,
        currentValue: brokersCur,
      }),
      explanation: `New broker-role signups in each window (not total active brokers). Compared to internal plan anchor ${brokerTarget}; short windows can be zero-heavy.`,
    },
    {
      measuredAt,
      targetType: "revenue",
      currentValue: revCur,
      previousValue: revPrev,
      delta: revCur - revPrev,
      gapChange: revGapNow - revGapPrev,
      outcomeBand: bandScaleDelta({
        delta: revCur - revPrev,
        targetType: "revenue",
        priorValue: revPrev,
        currentValue: revCur,
      }),
      explanation: `Sum of positive revenue events (CAD) in-window vs prior window vs notional target ${plan.revenueTarget}. Lumpy; interpret with care.`,
    },
  ];

  return metrics;
}
