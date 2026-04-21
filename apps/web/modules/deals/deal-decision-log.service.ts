import type { CommitteeRecommendation } from "@/modules/deals/deal.types";

export type CommitteeDecisionPayload = {
  recommendation: CommitteeRecommendation;
  rationale: string;
  confidenceLevel?: string | null;
  summary?: string;
  noGoTriggers?: string[];
  requiredConditions?: string[];
};

export function buildStructuredDecisionRecord(payload: CommitteeDecisionPayload): Record<string, unknown> {
  return {
    recommendation: payload.recommendation,
    rationale: payload.rationale,
    confidenceLevel: payload.confidenceLevel ?? null,
    committeeSummary: payload.summary ?? null,
    noGoTriggers: payload.noGoTriggers ?? [],
    requiredConditionsHints: payload.requiredConditions ?? [],
    recordedAt: new Date().toISOString(),
  };
}
