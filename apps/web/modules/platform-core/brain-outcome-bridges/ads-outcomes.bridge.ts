import type { BrainOutcomeRecord } from "../brain-v2.types";
import { classifyDecisionOutcome } from "../brain-outcome-evaluator.service";
import { readBeforeAfterFromMetadata, type PlatformDecisionLite } from "./metric-window";

/** Ads — uses stored CTR / conversion / profit-per-lead windows when present on the decision. */
export function extractAdsOutcome(decision: PlatformDecisionLite): BrainOutcomeRecord | null {
  if (decision.source !== "ADS") return null;
  const { before, after } = readBeforeAfterFromMetadata(decision.metadata);
  if (!before || !after) return null;
  return classifyDecisionOutcome({
    decisionId: decision.id,
    source: "ADS",
    entityType: decision.entityType,
    entityId: decision.entityId,
    actionType: decision.actionType,
    beforeMetrics: before,
    afterMetrics: after,
  });
}
