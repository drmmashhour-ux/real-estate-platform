import type { AutonomyActionCandidate, AutonomySignals } from "@/modules/autonomy/autonomy.types";
import type { AutonomyConfig } from "@prisma/client";
import { adjustFutureActionConfidence } from "@/modules/autonomy/learning/confidence-adjuster.service";
import { selectContextualActions } from "@/modules/autonomy/contextual/contextual-selector.service";
import type { RankedContextualAction } from "@/modules/autonomy/contextual/contextual-selector.service";

/**
 * Rules-only candidates → deterministic **contextual linear score** (bucket features + stored bucket rewards +
 * exploration bonus per stat). Policy engine remains the execution gate — this layer only ranks.
 */
export async function generateAutonomyActions(
  config: AutonomyConfig,
  scopeType: string,
  scopeId: string,
  signals: AutonomySignals
): Promise<RankedContextualAction[]> {
  const candidates: AutonomyActionCandidate[] = [];

  const lowOcc = config.minOccupancyThreshold ?? 0.45;
  const revDrop = config.anomalyDropThreshold ?? -0.15;

  if (signals.occupancyRate < lowOcc) {
    const baseConfidence = 0.8;
    const confidence = await adjustFutureActionConfidence(
      scopeType,
      scopeId,
      "pricing",
      "occupancy_low",
      "price_decrease",
      baseConfidence
    );

    candidates.push({
      domain: "pricing",
      signalKey: "occupancy_low",
      actionType: "price_decrease",
      payload: { pct: -0.1 },
      reason: `Low occupancy detected (threshold ${lowOcc})`,
      confidence,
    });
  }

  if (signals.revenueTrend < revDrop) {
    const baseConfidence = 0.75;
    const confidence = await adjustFutureActionConfidence(
      scopeType,
      scopeId,
      "promotions",
      "revenue_drop",
      "create_discount",
      baseConfidence
    );

    candidates.push({
      domain: "promotions",
      signalKey: "revenue_drop",
      actionType: "create_discount",
      payload: { pct: Math.min(0.15, config.maxDiscountPct ?? 0.15) },
      reason: `Revenue decline detected (threshold ${revDrop})`,
      confidence,
    });
  }

  if (signals.occupancyRate > 0.8) {
    const baseConfidence = 0.7;
    const confidence = await adjustFutureActionConfidence(
      scopeType,
      scopeId,
      "pricing",
      "occupancy_high",
      "price_increase",
      baseConfidence
    );

    candidates.push({
      domain: "pricing",
      signalKey: "occupancy_high",
      actionType: "price_increase",
      payload: { pct: 0.08 },
      reason: "High occupancy",
      confidence,
    });
  }

  if (candidates.length === 0) {
    return [];
  }

  const maxActions = config.maxActionsPerCycle ?? 2;

  return selectContextualActions({
    scopeType,
    scopeId,
    candidates,
    maxActions,
  });
}
