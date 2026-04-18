import type { AssistantRecommendation, GuardrailEvaluation } from "./operator.types";

const HIGH_IMPACT = new Set([
  "SCALE_CAMPAIGN",
  "PAUSE_CAMPAIGN",
  "RECOMMEND_PRICE_CHANGE",
  "BOOST_LISTING",
  "DOWNRANK_LISTING",
  "PROMOTE_EXPERIMENT_WINNER",
  "UPDATE_CTA_PRIORITY",
  "UPDATE_RETARGETING_MESSAGE_PRIORITY",
]);

const LEGALISH_SUMMARY = /\b(legal|compliance|Law 25|privacy policy|terms of service|cookie|copyright)\b/i;

function hasFraudBlockers(r: AssistantRecommendation): boolean {
  if (r.blockers?.some((b) => /fraud|trust review|review queue/i.test(b))) return true;
  if (r.warnings?.some((w) => /fraud|trust review/i.test(w))) return true;
  if (r.actionType === "REVIEW_LISTING" && r.source === "MARKETPLACE") return true;
  return false;
}

/**
 * Safety evaluation for operator layer — recommendations may still be shown when blocked.
 */
export function evaluateGuardrails(input: {
  recommendation: AssistantRecommendation;
  environment: "development" | "staging" | "production";
}): GuardrailEvaluation {
  const { recommendation: r, environment } = input;
  const blockingReasons: string[] = [];
  const warnings: string[] = [];

  const conf = r.confidenceLabel;
  const impact = HIGH_IMPACT.has(r.actionType);

  if (impact && conf === "LOW") {
    blockingReasons.push("High-impact action requires at least medium confidence — manual review required.");
  }

  if (r.actionType === "RECOMMEND_PRICE_CHANGE") {
    const ev = r.evidenceScore ?? 0;
    const eq = r.evidenceQuality;
    if (ev < 0.45 && eq !== "HIGH") {
      blockingReasons.push("Price guidance blocked until evidence quality improves or finance validates assumptions.");
    }
  }

  if (r.actionType === "SCALE_CAMPAIGN") {
    const spend = r.metrics?.estimatedSpend as number | undefined;
    const cpl = r.metrics?.cpl as number | undefined;
    const hasSpend = typeof spend === "number" && spend > 0;
    const hasCpl = typeof cpl === "number" && cpl > 0 && Number.isFinite(cpl);
    if (!hasSpend || !hasCpl) {
      blockingReasons.push("Scale suggestion blocked: spend and CPL must be present in platform data before increasing budgets.");
      warnings.push("Confirm spend and CPL in Ads Manager or growth ops spend tools.");
    }
  }

  if (r.actionType === "PROMOTE_EXPERIMENT_WINNER") {
    const vol = r.metrics?.experimentAssignments as number | undefined;
    if (typeof vol === "number" && vol > 0 && vol < 200) {
      blockingReasons.push("Promotion blocked: experiment volume is too low to treat the winner as conclusive.");
    }
  }

  if (r.actionType === "BOOST_LISTING" && hasFraudBlockers(r)) {
    blockingReasons.push("Boost blocked while fraud or trust review signals are present.");
  }

  if (LEGALISH_SUMMARY.test(r.summary) || LEGALISH_SUMMARY.test(r.title)) {
    blockingReasons.push("Recommendation touches legal/compliance copy — blocked from automated follow-through; legal review required.");
  }

  if (environment === "production" && r.metrics?.autoExecuteHint === true) {
    blockingReasons.push("Hidden or auto-execution hints are not allowed in production for this layer.");
  }

  if (r.confidenceScore < 0.35 && impact) {
    warnings.push("Low model confidence — treat as exploratory only.");
  }

  const allowed = blockingReasons.length === 0;
  return { allowed, blockingReasons, warnings };
}
