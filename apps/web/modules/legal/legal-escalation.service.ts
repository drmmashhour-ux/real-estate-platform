import type { LegalIntelligenceSummary } from "./legal-intelligence.types";
import type { LegalReviewQueueItemInput } from "./legal-intelligence.types";

export type LegalEscalationRecommendation =
  | "standard_review"
  | "priority_review"
  | "senior_review_recommended"
  | "manual_verification_recommended";

export type LegalEscalationAdvice = {
  recommendation: LegalEscalationRecommendation;
  reasons: string[];
};

export function recommendLegalEscalation(signalSummary: LegalIntelligenceSummary | null | undefined): LegalEscalationAdvice {
  const reasons: string[] = [];
  if (!signalSummary || signalSummary.totalSignals === 0) {
    return { recommendation: "standard_review", reasons: ["No advisory signals in scope — routine review cadence."] };
  }

  const c = signalSummary.countsBySeverity.critical;
  const w = signalSummary.countsBySeverity.warning;

  if (c >= 2) {
    reasons.push("Multiple critical advisory signals — allocate senior reviewer if available.");
    return { recommendation: "senior_review_recommended", reasons };
  }

  if (c >= 1 && w >= 2) {
    reasons.push("Mixed critical and repeated warning signals — prioritize queue placement.");
    return { recommendation: "priority_review", reasons };
  }

  if (signalSummary.topAnomalyKinds.some((x) => x.kind === "review_delay_risk" && x.count >= 2)) {
    reasons.push("Repeated review-delay signals — confirm staffing and SLA ownership.");
    return { recommendation: "manual_verification_recommended", reasons };
  }

  if (w >= 4) {
    reasons.push("Elevated warning volume — batch review may reduce thrash.");
    return { recommendation: "priority_review", reasons };
  }

  reasons.push("Signals within advisory thresholds — standard human review.");
  return { recommendation: "standard_review", reasons };
}

export function buildLegalEscalationNote(queueItem: LegalReviewQueueItemInput): string {
  const parts = [
    `Queue item ${queueItem.id} (${queueItem.entityType}:${queueItem.entityId})`,
    `Workflow ${queueItem.workflowType}`,
    `Last activity ${queueItem.submittedAt}`,
  ];
  if (typeof queueItem.missingCriticalRequirements === "number") {
    parts.push(`Critical gaps ~${queueItem.missingCriticalRequirements}`);
  }
  if (typeof queueItem.priorRejections === "number" && queueItem.priorRejections > 0) {
    parts.push(`Prior rejections (metadata window) ~${queueItem.priorRejections}`);
  }
  parts.push("Advisory only — no automated decision.");
  return parts.join(" · ");
}
