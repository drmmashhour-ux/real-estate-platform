import type { AssistantRecommendation } from "@/modules/operator/operator.types";
import type { AutonomousDomain, AutonomousExecutionCandidate } from "./autonomous-growth.types";
import type { AutonomousObservationResult } from "./autonomous-observation.service";

export type UnifiedAutonomousRow = {
  candidate: AutonomousExecutionCandidate;
  assistant: AssistantRecommendation;
};

function toDomain(src: AssistantRecommendation["source"]): AutonomousDomain {
  switch (src) {
    case "ADS":
      return "ADS";
    case "CRO":
      return "CRO";
    case "RETARGETING":
      return "RETARGETING";
    case "AB_TEST":
      return "AB_TEST";
    case "PROFIT":
      return "PROFIT";
    case "PORTFOLIO":
      return "PORTFOLIO";
    case "MARKETPLACE":
      return "MARKETPLACE";
    case "UNIFIED":
    default:
      return "UNIFIED";
  }
}

function baseCandidateFromAssistant(
  r: AssistantRecommendation,
  extra: Partial<AutonomousExecutionCandidate> & { blockers?: string[]; policyAllowed?: boolean },
): AutonomousExecutionCandidate {
  return {
    recommendationId: r.id,
    source: toDomain(r.source),
    actionType: r.actionType,
    entityType: r.targetId ? "CAMPAIGN_OR_ENTITY" : null,
    entityId: r.targetId ?? null,
    trustScore: 0,
    confidenceScore: r.confidenceScore,
    evidenceScore: r.evidenceScore ?? null,
    priorityScore: 0,
    autonomyMode: "UNSET",
    policyAllowed: extra.policyAllowed ?? true,
    requiresApproval: false,
    requiresSimulation: false,
    warnings: [...(r.warnings ?? [])],
    blockers: [...(r.blockers ?? []), ...(extra.blockers ?? [])],
    metadata: {
      title: r.title,
      summary: r.summary.slice(0, 500),
      reason: r.reason,
      confidenceLabel: r.confidenceLabel,
      evidenceQuality: r.evidenceQuality,
      metrics: r.metrics,
    },
  };
}

export type UnifierInput = {
  observation: AutonomousObservationResult;
};

/**
 * Normalizes assistant-layer recommendations into a single candidate list (no duplicate scoring rules).
 */
export function unifyAutonomousRecommendations(input: UnifierInput): UnifiedAutonomousRow[] {
  const feed = input.observation.raw.assistantFeed;
  if (!feed) return [];

  const out: UnifiedAutonomousRow[] = [];

  for (const r of feed.topRecommendations) {
    out.push({
      assistant: r,
      candidate: baseCandidateFromAssistant(r, {}),
    });
  }

  for (const { recommendation: r, guardrail } of feed.blockedRecommendations) {
    out.push({
      assistant: r,
      candidate: baseCandidateFromAssistant(r, {
        policyAllowed: false,
        blockers: guardrail.blockingReasons,
      }),
    });
  }

  for (const r of feed.monitoringOnly) {
    out.push({
      assistant: r,
      candidate: baseCandidateFromAssistant(r, {
        policyAllowed: true,
        blockers: [],
      }),
    });
  }

  return out;
}
