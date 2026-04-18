import type { BrainOutcomeRecord } from "../brain-v2.types";
import { classifyDecisionOutcome } from "../brain-outcome-evaluator.service";
import { readBeforeAfterFromMetadata, type PlatformDecisionLite } from "./metric-window";

/** A/B — variant vs baseline metrics when both snapshots exist. */
export function extractAbOutcome(decision: PlatformDecisionLite): BrainOutcomeRecord | null {
  if (decision.source !== "AB_TEST") return null;
  const { before, after } = readBeforeAfterFromMetadata(decision.metadata);
  if (!before || !after) return null;
  return classifyDecisionOutcome({
    decisionId: decision.id,
    source: "AB_TEST",
    entityType: decision.entityType,
    entityId: decision.entityId,
    actionType: decision.actionType,
    beforeMetrics: before,
    afterMetrics: after,
  });
}
