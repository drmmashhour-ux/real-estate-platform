/**
 * Overall cadence health — explainable, aligned with executive + governance + learning control.
 */

import type { GrowthCadenceStatus } from "./growth-cadence.types";
import type { GrowthExecutiveSummary } from "./growth-executive.types";
import type { GrowthGovernanceDecision } from "./growth-governance.types";
import type { GrowthLearningControlDecision } from "./growth-governance-learning.types";

export function deriveGrowthCadenceStatus(args: {
  executiveStatus: GrowthExecutiveSummary["status"] | null;
  governance: GrowthGovernanceDecision | null;
  learningControl: GrowthLearningControlDecision | null;
}): GrowthCadenceStatus {
  const g = args.governance?.status;
  if (g === "human_review_required" || g === "freeze_recommended") return "watch";
  const lc = args.learningControl?.state;
  if (lc === "freeze_recommended" || lc === "reset_recommended") return "watch";
  if (lc === "monitor") return "watch";

  const e = args.executiveStatus;
  if (e === "weak") return "weak";
  if (e === "strong") return "strong";
  if (e === "healthy") return "healthy";
  return "watch";
}
