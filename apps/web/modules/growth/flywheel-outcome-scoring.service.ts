/**
 * Deterministic outcome scoring — no implied causality; compares metric snapshots only.
 */

import type { FlywheelActionType } from "@/modules/growth/flywheel-action.types";
import type { FlywheelMarketplaceMetrics } from "@/modules/marketplace/flywheel.service";
import type { FlywheelOutcomeScore } from "@/modules/growth/flywheel-action.types";

export const MIN_EVALUATION_DAYS = 7;
export const MIN_BASELINE_LEADS_FOR_RATES = 10;
export const MIN_CURRENT_LEADS_FOR_RATES = 10;

const RATE_IMPROVE = 0.025;
const RATE_REGRESS = -0.025;

export type MetricDeltas = {
  brokerCountDelta: number;
  leadCountDelta: number;
  listingCountDelta: number;
  conversionRateDelta: number;
  unlockRateDelta: number;
};

/** Baseline metrics subset stored on action creation. */
export type BaselineSubset = Pick<
  FlywheelMarketplaceMetrics,
  "brokerCount" | "leadCount30" | "activeListings" | "unlockRate" | "winRate"
>;

export function computeFlywheelMetricDeltas(
  baseline: BaselineSubset,
  current: FlywheelMarketplaceMetrics,
): MetricDeltas {
  return {
    brokerCountDelta: current.brokerCount - baseline.brokerCount,
    leadCountDelta: current.leadCount30 - baseline.leadCount30,
    listingCountDelta: current.activeListings - baseline.activeListings,
    conversionRateDelta: current.winRate - baseline.winRate,
    unlockRateDelta: current.unlockRate - baseline.unlockRate,
  };
}

export type ScoreOutcomeInput = {
  actionType: FlywheelActionType;
  baseline: BaselineSubset;
  current: FlywheelMarketplaceMetrics;
  deltas: MetricDeltas;
  /** Whole days since action was created */
  daysSinceCreation: number;
};

/**
 * Rules (v1):
 * - insufficient_data: evaluation before MIN_EVALUATION_DAYS, or thin lead volume for rate-based reads.
 * - positive: primary KPI for this action type improved by a fixed threshold (counts or rates).
 * - negative: primary KPI worsened past the negative threshold.
 * - neutral: mixed or small movements.
 */
export function scoreFlywheelOutcome(input: ScoreOutcomeInput): {
  outcomeScore: FlywheelOutcomeScore;
  explanation: string;
} {
  const { actionType, baseline, current, deltas, daysSinceCreation } = input;

  if (daysSinceCreation < MIN_EVALUATION_DAYS) {
    return {
      outcomeScore: "insufficient_data",
      explanation: `Only ${daysSinceCreation} day(s) since action creation — minimum ${MIN_EVALUATION_DAYS} days recommended before comparing rolling 30d snapshots.`,
    };
  }

  const thinRateWindows =
    baseline.leadCount30 < MIN_BASELINE_LEADS_FOR_RATES ||
    current.leadCount30 < MIN_CURRENT_LEADS_FOR_RATES;

  switch (actionType) {
    case "broker_acquisition": {
      if (deltas.brokerCountDelta >= 2) {
        return {
          outcomeScore: "positive",
          explanation: `Broker count increased by ${deltas.brokerCountDelta} vs baseline snapshot (same 30d metric definitions).`,
        };
      }
      if (deltas.brokerCountDelta <= -1) {
        return {
          outcomeScore: "negative",
          explanation: `Broker count decreased by ${Math.abs(deltas.brokerCountDelta)} vs baseline.`,
        };
      }
      return {
        outcomeScore: "neutral",
        explanation: `Broker count change (${deltas.brokerCountDelta}) is within neutral band — no strong signal.`,
      };
    }
    case "demand_generation": {
      const meaningfulUp = deltas.leadCountDelta >= meaningfulLeadDeltaUp(baseline.leadCount30);
      const meaningfulDown = deltas.leadCountDelta <= -meaningfulLeadDeltaUp(baseline.leadCount30);
      if (meaningfulUp) {
        return {
          outcomeScore: "positive",
          explanation: `30d lead volume up by ${deltas.leadCountDelta} vs baseline — demand signal improved on this snapshot.`,
        };
      }
      if (meaningfulDown) {
        return {
          outcomeScore: "negative",
          explanation: `30d lead volume dropped materially (${deltas.leadCountDelta}) vs baseline.`,
        };
      }
      return {
        outcomeScore: "neutral",
        explanation: `Lead volume delta (${deltas.leadCountDelta}) is modest — mixed or early movement.`,
      };
    }
    case "supply_growth": {
      if (deltas.listingCountDelta >= 2) {
        return {
          outcomeScore: "positive",
          explanation: `Active approved listings up by ${deltas.listingCountDelta} vs baseline snapshot.`,
        };
      }
      if (deltas.listingCountDelta <= -2) {
        return {
          outcomeScore: "negative",
          explanation: `Listing count fell by ${Math.abs(deltas.listingCountDelta)} vs baseline.`,
        };
      }
      return {
        outcomeScore: "neutral",
        explanation: `Listing inventory change (${deltas.listingCountDelta}) is small on this window.`,
      };
    }
    case "conversion_fix":
    case "pricing_adjustment": {
      if (thinRateWindows) {
        return {
          outcomeScore: "insufficient_data",
          explanation:
            `Unlock/win rates need at least ~${MIN_BASELINE_LEADS_FOR_RATES} leads in both baseline and current 30d windows — thin volume avoids fake precision.`,
        };
      }
      const primaryDelta = deltas.unlockRateDelta;
      if (primaryDelta >= RATE_IMPROVE) {
        return {
          outcomeScore: "positive",
          explanation: `Unlock rate moved by ${(primaryDelta * 100).toFixed(1)} percentage points vs baseline (rolling 30d definitions unchanged).`,
        };
      }
      if (primaryDelta <= RATE_REGRESS) {
        return {
          outcomeScore: "negative",
          explanation: `Unlock rate declined by ${Math.abs(primaryDelta * 100).toFixed(1)} percentage points vs baseline.`,
        };
      }
      if (Math.abs(deltas.conversionRateDelta) >= RATE_IMPROVE && actionType === "conversion_fix") {
        return {
          outcomeScore: "positive",
          explanation: `Pipeline win rate moved by ${(deltas.conversionRateDelta * 100).toFixed(1)} percentage points — secondary KPI for conversion actions.`,
        };
      }
      return {
        outcomeScore: "neutral",
        explanation: `Rate changes are within neutral band (unlock Δ ${(deltas.unlockRateDelta * 100).toFixed(2)} pp).`,
      };
    }
  }
}

function meaningfulLeadDeltaUp(baselineLeads: number): number {
  return Math.max(5, Math.ceil(baselineLeads * 0.08));
}
