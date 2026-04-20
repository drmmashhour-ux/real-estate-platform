/**
 * Deterministic operator copy — what wrong / what “fixed” roughly means / what to verify.
 */

import type { GrowthPolicyResult } from "@/modules/growth/policy/growth-policy.types";

export type GrowthPolicyResolutionCopy = {
  /** Plain “what’s wrong” for operators. */
  explanation: string;
  /** Rough signal that concern is alleviated — not automated verification. */
  resolvedLooksLike: string;
  /** Preconditions before treating the warning as stale. */
  checksBeforeClear: string[];
};

const FALLBACK_CHECKS = [
  "Underlying metrics used by this rule have refreshed (window aligned).",
  "No conflicting governance freeze or enforcement block remains relevant.",
];

function baseFromResult(p: GrowthPolicyResult): GrowthPolicyResolutionCopy {
  return {
    explanation: `${p.description} (${p.domain})`,
    resolvedLooksLike: `Signals align with recommendation: "${p.recommendation.slice(0, 220)}"`,
    checksBeforeClear: FALLBACK_CHECKS,
  };
}

/** Deterministic templates keyed by canonical policy ids from `growth-policy.service`. */
export function buildGrowthPolicyResolution(p: GrowthPolicyResult): GrowthPolicyResolutionCopy {
  switch (p.id) {
    case "policy-governance-freeze-status":
      return {
        explanation: "Governance recommends freezing risky expansion until review.",
        resolvedLooksLike:
          "Governance posture moved out of freeze / human_review_required cleared in governance console.",
        checksBeforeClear: ["Review checklist completed", "Executive / governance approval logged", ...FALLBACK_CHECKS],
      };
    case "policy-governance-human-review-status":
      return {
        explanation: "Human approval is required before pushing more automated growth promotion.",
        resolvedLooksLike:
          "Required reviews recorded and governance signals no longer block promotion in your process.",
        checksBeforeClear: ["Owners acknowledged", "No open critical governance risks", ...FALLBACK_CHECKS],
      };
    case "policy-ads-zero-leads":
      return {
        explanation: "Paid/tracked activity exists but zero recorded leads — tracking or offer mismatch.",
        resolvedLooksLike: "Lead capture events appear for the same spend window with sane attribution.",
        checksBeforeClear: ["Landing events firing", "Form/CTA verified", ...FALLBACK_CHECKS],
      };
    case "policy-ads-low-conversion-rate":
      return {
        explanation: "High clicks but conversion rate below conservative floor.",
        resolvedLooksLike: "Conversion rate lifts above floor or spend paused until creative fixed.",
        checksBeforeClear: ["Creative + audience reviewed", "No silent tracking gaps", ...FALLBACK_CHECKS],
      };
    case "policy-leads-view-no-unlock":
      return {
        explanation: "Views without unlocks — pricing preview or trust friction.",
        resolvedLooksLike: "Unlock rate moves off zero with stable pricing intent.",
        checksBeforeClear: ["Pricing experiments documented", "Preview quality checked", ...FALLBACK_CHECKS],
      };
    case "policy-leads-followup-critical":
      return {
        explanation: "Volume exists but follow-up completion is dangerously low.",
        resolvedLooksLike: "Queue ratio improves or intake is throttled to match capacity.",
        checksBeforeClear: ["CRM queue audited", "Broker capacity confirmed", ...FALLBACK_CHECKS],
      };
    case "policy-messaging-queue-response":
      return {
        explanation: "Queued follow-ups outpacing responses.",
        resolvedLooksLike: "Response throughput matches queue pressure or queue reduced intentionally.",
        checksBeforeClear: ["Templates reviewed", "Ownership clear", ...FALLBACK_CHECKS],
      };
    case "policy-broker-weak-close":
    case "policy-broker-slow-dominance":
      return {
        explanation: "Broker-side throughput or quality signals are weak vs roster size.",
        resolvedLooksLike: "Routing/coaching adjustments reflected in broker metrics snapshot.",
        checksBeforeClear: ["Slow responders addressed", "Elite routing rules reviewed", ...FALLBACK_CHECKS],
      };
    case "policy-pricing-unstable-flag":
    case "policy-pricing-volatility":
      return {
        explanation: "Pricing intelligence shows instability — experiments are riskier.",
        resolvedLooksLike: "Volatility/stability flags calm or experiments deliberately paused.",
        checksBeforeClear: ["Admin pricing views reviewed", "No conflicting overrides", ...FALLBACK_CHECKS],
      };
    case "policy-content-weak-engagement":
      return {
        explanation: "Content output without engagement lift.",
        resolvedLooksLike: "Engagement signals appear or output cadence reduced intentionally.",
        checksBeforeClear: ["Distribution channels verified", ...FALLBACK_CHECKS],
      };
    case "policy-cro-low-conversion":
      return {
        explanation: "Traffic exists but conversion vs visits is very low.",
        resolvedLooksLike: "Conversion ratio improves or traffic reduced until UX fixes ship.",
        checksBeforeClear: ["Forms/speed/trust reviewed", ...FALLBACK_CHECKS],
      };
    default:
      return baseFromResult(p);
  }
}
