import type { StrategyBucketOutcome } from "@prisma/client";
import { reinforcementLog } from "./reinforcement-logger";

/**
 * Outcome → bounded reward in [0,1]. Deterministic; not a value judgment on any person.
 *
 * - WON: 0.85 + small bonuses
 * - LOST: 0.15
 * - STALLED: 0.45
 * - optional bonuses: faster close, stage up, fewer objections, engagement up (capped)
 */
export type ComputeStrategyRewardInput = {
  outcome: StrategyBucketOutcome;
  closingTimeDays?: number | null;
  /** Heuristic 0–1, optional */
  stageProgressionDelta?: number | null;
  /** Heuristic 0–1, optional */
  objectionResolutionSignal?: number | null;
  /** Heuristic 0–1, optional */
  engagementImprovementSignal?: number | null;
};

/**
 * @returns reward in [0, 1]
 */
export function computeStrategyReward(params: ComputeStrategyRewardInput): number {
  const { outcome } = params;
  let base: number;
  if (outcome === "WON") base = 0.85;
  else if (outcome === "LOST") base = 0.12;
  else base = 0.42; // STALLED

  if (outcome === "WON" && typeof params.closingTimeDays === "number" && params.closingTimeDays > 0) {
    if (params.closingTimeDays < 30) base += 0.08;
    else if (params.closingTimeDays < 60) base += 0.04;
  }
  if (outcome === "WON" && (params.stageProgressionDelta ?? 0) > 0.5) base += 0.04;
  if (outcome === "WON" && (params.objectionResolutionSignal ?? 0) > 0.5) base += 0.04;
  if (outcome === "WON" && (params.engagementImprovementSignal ?? 0) > 0.5) base += 0.04;

  const r = Math.max(0, Math.min(1, base));
  reinforcementLog.reward({ outcome, r });
  return r;
}
