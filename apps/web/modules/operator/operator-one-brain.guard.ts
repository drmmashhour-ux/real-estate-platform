import type { AssistantRecommendation } from "./operator.types";
import type { BrainDecisionInput } from "@/modules/platform-core/one-brain.contract";
import { processBrainDecision } from "@/modules/platform-core/one-brain.processor";

function mapAssistantSourceToBrain(s: AssistantRecommendation["source"]): BrainDecisionInput["source"] {
  if (
    s === "ADS" ||
    s === "CRO" ||
    s === "RETARGETING" ||
    s === "AB_TEST" ||
    s === "PROFIT" ||
    s === "MARKETPLACE" ||
    s === "UNIFIED"
  ) {
    return s;
  }
  return "MARKETPLACE";
}

function entityTypeForBrain(rec: AssistantRecommendation): BrainDecisionInput["entityType"] {
  const a = rec.actionType;
  if (a.includes("LISTING") || rec.source === "MARKETPLACE") return "LISTING";
  if (a.includes("EXPERIMENT") || a.includes("VARIANT") || rec.source === "AB_TEST") return "EXPERIMENT";
  return "CAMPAIGN";
}

function learningSignalsFromMetrics(m: Record<string, unknown> | undefined): string[] | undefined {
  if (!m) return undefined;
  const ls = m.learningSignals;
  if (Array.isArray(ls)) return ls.filter((x): x is string => typeof x === "string");
  return undefined;
}

export function brainDecisionFromAssistantRecommendation(rec: AssistantRecommendation): ReturnType<typeof processBrainDecision> {
  const m = rec.metrics;
  const metrics = m && typeof m === "object" ? (m as Record<string, unknown>) : undefined;

  const input: BrainDecisionInput = {
    source: mapAssistantSourceToBrain(rec.source),
    entityType: entityTypeForBrain(rec),
    entityId: rec.targetId ?? null,
    actionType: rec.actionType,
    confidenceScore: rec.confidenceScore,
    evidenceScore: rec.evidenceScore ?? null,
    learningSignals: learningSignalsFromMetrics(metrics),
    geo: undefined,
    reason: rec.reason,
    expectedImpact: rec.expectedImpact ?? null,
    warnings: rec.warnings,
    blockers: rec.blockers,
  };

  return processBrainDecision(input);
}

/** True when outbound / mutating execution should proceed per One Brain trust policy. */
export function isOneBrainExecuteAllowedForRecommendation(rec: AssistantRecommendation): boolean {
  const out = brainDecisionFromAssistantRecommendation(rec);
  return out.executionAllowed;
}
