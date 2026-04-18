import type { AssistantRecommendation } from "./operator.types";
import type { GuardrailEvaluation } from "./operator.types";

export type SafetyBadge =
  | "high_confidence"
  | "medium_confidence"
  | "low_confidence"
  | "insufficient_data"
  | "manual_verification_recommended"
  | "blocked_by_guardrails";

const LABELS: Record<SafetyBadge, string> = {
  high_confidence: "High confidence",
  medium_confidence: "Medium confidence",
  low_confidence: "Low confidence",
  insufficient_data: "Insufficient data",
  manual_verification_recommended: "Manual verification recommended",
  blocked_by_guardrails: "Blocked by guardrails",
};

export function badgeLabel(b: SafetyBadge): string {
  return LABELS[b];
}

export function getRecommendationSafetyBadges(
  r: AssistantRecommendation,
  guardrail?: GuardrailEvaluation | null,
): SafetyBadge[] {
  const out: SafetyBadge[] = [];
  if (guardrail && !guardrail.allowed) {
    out.push("blocked_by_guardrails");
  }
  if (r.confidenceLabel === "HIGH") out.push("high_confidence");
  else if (r.confidenceLabel === "MEDIUM") out.push("medium_confidence");
  else out.push("low_confidence");

  if (r.evidenceQuality === "LOW" || (r.evidenceScore != null && r.evidenceScore < 0.35)) {
    out.push("insufficient_data");
  }
  if (r.warnings?.length || r.blockers?.length) {
    out.push("manual_verification_recommended");
  }
  return [...new Set(out)];
}
