import type { AssistantRecommendation, RecommendationConflict, GuardrailEvaluation } from "./operator.types";

export function buildRecommendationExplanation(recommendation: AssistantRecommendation): string {
  const lines = [
    `What: ${recommendation.title}`,
    `Why: ${recommendation.reason}`,
    `Confidence: ${recommendation.confidenceLabel} (${(recommendation.confidenceScore * 100).toFixed(0)}% score).`,
  ];
  if (recommendation.evidenceQuality) {
    lines.push(`Evidence quality: ${recommendation.evidenceQuality}.`);
  }
  lines.push(
    `What could be wrong: sparse events, attribution gaps, or changing market conditions not yet in this window.`,
  );
  if (recommendation.warnings?.length) {
    lines.push(`Caveats: ${recommendation.warnings.join(" ")}`);
  }
  lines.push(`Next step: ${recommendation.operatorAction ?? "Review manually; no automatic execution from this panel."}`);
  return lines.join("\n");
}

export function buildConflictExplanation(conflict: RecommendationConflict): string {
  return [
    `Target: ${conflict.targetId ?? "(unspecified)"}.`,
    `Conflicting actions: ${conflict.actionTypes.join(" vs ")}.`,
    `Sources: ${conflict.sources.join(", ")}.`,
    `Severity: ${conflict.severity}.`,
    `Reason: ${conflict.reason}`,
    `Next step: reconcile manually; do not apply both without operator judgment.`,
  ].join("\n");
}

export function buildGuardrailExplanation(
  recommendation: AssistantRecommendation,
  guardrail: GuardrailEvaluation,
): string {
  const parts = [
    `Recommendation “${recommendation.title}” is shown for transparency but is blocked by guardrails.`,
    guardrail.blockingReasons.length ? `Blocking: ${guardrail.blockingReasons.join(" ")}` : "",
    guardrail.warnings.length ? `Warnings: ${guardrail.warnings.join(" ")}` : "",
    `If data improves (volume, spend, fraud clearance), re-run the growth feed and review again.`,
  ].filter(Boolean);
  return parts.join("\n");
}
