/**
 * Outcome evaluation — compares baseline vs current rolling 30d snapshots; persists auditable rows.
 */

import { prisma } from "@/lib/db";
import {
  collectFlywheelMarketplaceMetrics,
} from "@/modules/marketplace/flywheel.service";
import type { FlywheelActionOutcome, FlywheelOutcomeScore } from "@/modules/growth/flywheel-action.types";
import { computeFlywheelMetricDeltas, scoreFlywheelOutcome } from "@/modules/growth/flywheel-outcome-scoring.service";
import { getFlywheelActionById } from "@/modules/growth/flywheel-action.service";
import { monitorFlywheelOutcomeEvaluated } from "@/modules/growth/flywheel-monitoring.service";

function mapOutcomeRow(row: {
  actionId: string;
  measuredAt: Date;
  brokerCountDelta: number;
  leadCountDelta: number;
  listingCountDelta: number;
  conversionRateDelta: number;
  unlockRateDelta: number;
  revenueDelta: number | null;
  outcomeScore: string;
  explanation: string;
}): FlywheelActionOutcome {
  return {
    actionId: row.actionId,
    measuredAt: row.measuredAt.toISOString(),
    brokerCountDelta: row.brokerCountDelta,
    leadCountDelta: row.leadCountDelta,
    listingCountDelta: row.listingCountDelta,
    conversionRateDelta: row.conversionRateDelta,
    unlockRateDelta: row.unlockRateDelta,
    revenueDelta: row.revenueDelta,
    outcomeScore: row.outcomeScore as FlywheelOutcomeScore,
    explanation: row.explanation,
  };
}

export async function evaluateFlywheelOutcome(actionId: string): Promise<FlywheelActionOutcome | null> {
  const action = await getFlywheelActionById(actionId);
  if (!action) return null;

  const row = await prisma.marketplaceFlywheelAction.findUnique({ where: { id: actionId } });
  if (!row) return null;

  const createdAt = new Date(row.createdAt);
  const daysSinceCreation = Math.floor((Date.now() - createdAt.getTime()) / (86400000));

  const baseline = {
    brokerCount: row.baselineBrokers,
    leadCount30: row.baselineLeads30,
    activeListings: row.baselineListings,
    unlockRate: row.baselineUnlockRate,
    winRate: row.baselineConversionRate,
  };

  const currentMetrics = await collectFlywheelMarketplaceMetrics();

  const deltas = computeFlywheelMetricDeltas(baseline, currentMetrics);

  const { outcomeScore, explanation } = scoreFlywheelOutcome({
    actionType: action.type,
    baseline,
    current: currentMetrics,
    deltas,
    daysSinceCreation,
  });

  const saved = await prisma.marketplaceFlywheelActionOutcome.create({
    data: {
      actionId,
      brokerCountDelta: deltas.brokerCountDelta,
      leadCountDelta: deltas.leadCountDelta,
      listingCountDelta: deltas.listingCountDelta,
      conversionRateDelta: deltas.conversionRateDelta,
      unlockRateDelta: deltas.unlockRateDelta,
      revenueDelta: null,
      outcomeScore,
      explanation,
    },
  });

  monitorFlywheelOutcomeEvaluated({
    actionId,
    outcomeScore,
    measuredAt: saved.measuredAt.toISOString(),
  });

  return mapOutcomeRow({
    actionId: saved.actionId,
    measuredAt: saved.measuredAt,
    brokerCountDelta: saved.brokerCountDelta,
    leadCountDelta: saved.leadCountDelta,
    listingCountDelta: saved.listingCountDelta,
    conversionRateDelta: saved.conversionRateDelta,
    unlockRateDelta: saved.unlockRateDelta,
    revenueDelta: saved.revenueDelta,
    outcomeScore: saved.outcomeScore,
    explanation: saved.explanation,
  });
}

export async function listOutcomesForAction(actionId: string, take = 20): Promise<FlywheelActionOutcome[]> {
  const rows = await prisma.marketplaceFlywheelActionOutcome.findMany({
    where: { actionId },
    orderBy: { measuredAt: "desc" },
    take,
  });
  return rows.map((r) =>
    mapOutcomeRow({
      actionId: r.actionId,
      measuredAt: r.measuredAt,
      brokerCountDelta: r.brokerCountDelta,
      leadCountDelta: r.leadCountDelta,
      listingCountDelta: r.listingCountDelta,
      conversionRateDelta: r.conversionRateDelta,
      unlockRateDelta: r.unlockRateDelta,
      revenueDelta: r.revenueDelta,
      outcomeScore: r.outcomeScore,
      explanation: r.explanation,
    }),
  );
}
