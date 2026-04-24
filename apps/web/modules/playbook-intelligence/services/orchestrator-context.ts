import type { PlaybookExecutionMode } from "@prisma/client";
import type { PlaybookComparableContext, RecommendationRequestContext, RetrievalContextInput } from "@/modules/playbook-memory/types/playbook-memory.types";
function mapHintToRequestAutonomy(
  autonomyMode: RecommendationRequestContext["autonomyMode"] | undefined,
  hint: PlaybookExecutionMode | undefined,
): RecommendationRequestContext["autonomyMode"] | undefined {
  if (autonomyMode != null) {
    return autonomyMode;
  }
  if (hint == null) {
    return undefined;
  }
  if (hint === "HUMAN_APPROVAL") {
    return "ASSIST";
  }
  if (hint === "RECOMMEND_ONLY") {
    return "OFF";
  }
  if (hint === "SAFE_AUTOPILOT" || hint === "FULL_AUTOPILOT") {
    return hint;
  }
  return undefined;
}

/**
 * Match `playbook-memory-retrieval.service` `toRecommendationRequestContext` (single source of truth for mapping).
 */
export function toRecommendationRequestContextFromRetrieval(
  input: RetrievalContextInput,
): RecommendationRequestContext {
  const c: PlaybookComparableContext = input.context;
  return {
    domain: c.domain as RecommendationRequestContext["domain"],
    entityType: c.entityType,
    market: c.market as unknown as Record<string, string | number | boolean | null> | undefined,
    segment: c.segment as unknown as Record<string, string | number | boolean | null> | undefined,
    signals: c.signals,
    policyFlags: input.policyFlags,
    autonomyMode: mapHintToRequestAutonomy(input.autonomyMode, input.autonomyModeHint),
    candidatePlaybookIds: input.candidatePlaybookIds,
  };
}
