/**
 * Derives advisory strategy status from signals — deterministic, explainable.
 */

import type { GrowthStrategyPlanStatus } from "./growth-strategy.types";

export type StrategyStatusInput = {
  governanceRiskHigh: boolean;
  governanceHumanReview: boolean;
  governanceFreeze: boolean;
  blockerCount: number;
  executiveWeak: boolean;
  executiveStrong: boolean;
  acquisitionWeak: boolean;
  fusionWeak: boolean;
  strongCampaignAndLeads: boolean;
  missingDataHeavy: boolean;
};

export function deriveGrowthStrategyStatus(input: StrategyStatusInput): GrowthStrategyPlanStatus {
  const {
    governanceRiskHigh,
    governanceHumanReview,
    governanceFreeze,
    blockerCount,
    executiveWeak,
    executiveStrong,
    acquisitionWeak,
    fusionWeak,
    strongCampaignAndLeads,
    missingDataHeavy,
  } = input;

  if (governanceFreeze || (governanceHumanReview && governanceRiskHigh)) {
    return "watch";
  }
  if (governanceRiskHigh && blockerCount >= 3) {
    return "watch";
  }
  if (missingDataHeavy && blockerCount >= 2) {
    return "watch";
  }
  if (executiveWeak && acquisitionWeak && fusionWeak) {
    return "weak";
  }
  if (acquisitionWeak && fusionWeak && !executiveStrong) {
    return "weak";
  }
  if (strongCampaignAndLeads && !governanceRiskHigh && blockerCount <= 1) {
    return "strong";
  }
  if (executiveStrong && !governanceRiskHigh && blockerCount <= 2) {
    return "healthy";
  }
  return "healthy";
}
