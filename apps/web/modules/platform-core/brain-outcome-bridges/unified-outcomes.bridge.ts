import type { BrainOutcomeRecord } from "../brain-v2.types";
import { classifyDecisionOutcome } from "../brain-outcome-evaluator.service";
import { readBeforeAfterFromMetadata, type PlatformDecisionLite } from "./metric-window";

export function extractUnifiedOutcome(decision: PlatformDecisionLite): BrainOutcomeRecord | null {
  if (decision.source !== "UNIFIED") return null;
  const { before, after } = readBeforeAfterFromMetadata(decision.metadata);
  if (!before || !after) return null;
  return classifyDecisionOutcome({
    decisionId: decision.id,
    source: "UNIFIED",
    entityType: decision.entityType,
    entityId: decision.entityId,
    actionType: decision.actionType,
    beforeMetrics: before,
    afterMetrics: after,
  });
}
