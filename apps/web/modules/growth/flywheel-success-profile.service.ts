/**
 * Aggregates measured flywheel outcomes into per-action-type success profiles — no execution.
 */

import { prisma } from "@/lib/db";
import type { GrowthActionSuccessProfile } from "@/modules/growth/flywheel-success-suggestions.types";
import { monitorFlywheelSuccessProfilesBuilt } from "@/modules/growth/flywheel-auto-suggest-monitoring.service";

function confidenceFromTotal(n: number): GrowthActionSuccessProfile["confidenceLevel"] {
  if (n >= 14) return "high";
  if (n >= 6) return "medium";
  return "low";
}

export async function buildGrowthActionSuccessProfiles(): Promise<GrowthActionSuccessProfile[]> {
  const outcomes = await prisma.marketplaceFlywheelActionOutcome.findMany({
    include: { action: { select: { type: true } } },
    orderBy: { measuredAt: "desc" },
    take: 800,
  });

  const byType = new Map<
    string,
    {
      pos: number;
      neu: number;
      neg: number;
      ins: number;
      lastAt: Date | null;
    }
  >();

  for (const o of outcomes) {
    const t = o.action.type;
    if (!byType.has(t)) byType.set(t, { pos: 0, neu: 0, neg: 0, ins: 0, lastAt: null });
    const b = byType.get(t)!;
    if (!b.lastAt) b.lastAt = o.measuredAt;
    switch (o.outcomeScore) {
      case "positive":
        b.pos++;
        break;
      case "neutral":
        b.neu++;
        break;
      case "negative":
        b.neg++;
        break;
      default:
        b.ins++;
        break;
    }
  }

  const actionCounts = await prisma.marketplaceFlywheelAction.groupBy({
    by: ["type"],
    _count: { type: true },
  });
  const countByType = new Map(actionCounts.map((r) => [r.type, r._count.type]));

  const profiles: GrowthActionSuccessProfile[] = [];

  const types = [...new Set([...byType.keys(), ...countByType.keys()])].sort();

  for (const actionType of types) {
    const agg = byType.get(actionType) ?? { pos: 0, neu: 0, neg: 0, ins: 0, lastAt: null };
    const scored = agg.pos + agg.neu + agg.neg;
    const totalEvaluated = agg.pos + agg.neu + agg.neg + agg.ins;
    const successRate = scored > 0 ? agg.pos / scored : null;
    const notes: string[] = [];
    if (scored < 5) notes.push("Sparse scored outcomes — treat success rate as directional only.");
    if (agg.ins > scored) notes.push("High share of insufficient_data evaluations — measurement noise likely.");

    profiles.push({
      actionType,
      totalActions: countByType.get(actionType) ?? 0,
      positiveCount: agg.pos,
      neutralCount: agg.neu,
      negativeCount: agg.neg,
      insufficientCount: agg.ins,
      successRate,
      confidenceLevel: confidenceFromTotal(scored),
      lastMeasuredAt: agg.lastAt?.toISOString() ?? null,
      notes,
    });
  }

  monitorFlywheelSuccessProfilesBuilt({ profiles: profiles.length });
  return profiles;
}
