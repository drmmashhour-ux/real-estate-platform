import type { AiHub } from "../core/types";
import {
  decisionTypeForHub,
  type DecisionEngineResult,
  type DecisionRecommendation,
  type DecisionRiskItem,
  type PriorityLevel,
} from "./decision-types";

function hubFallbackAction(hub?: AiHub): string {
  switch (hub) {
    case "buyer":
      return "Open your saved listing and confirm carrying costs before you contact the seller.";
    case "seller":
      return "Open your draft listing and finish photos plus declaration before publish.";
    case "bnhub":
      return "Review your next check-in and payout timing on the booking detail.";
    case "rent":
      return "Verify lease dates and deposit in the rent hub before you sign.";
    case "broker":
      return "Open your pipeline and log the next touch on your hottest lead.";
    case "mortgage":
      return "Upload income and ID so a broker can confirm affordability (not a commitment).";
    case "investor":
      return "Open Compare and stress-test your lowest-ROI saved deal.";
    case "admin":
      return "Triage open disputes and pending payouts before batch finance export.";
    default:
      return "Complete the highest-impact checklist in this hub, then refresh this assist.";
  }
}

export function recommendationsForContext(params: {
  hub: AiHub;
  risks: DecisionRiskItem[];
  snapshotLabel: string;
}): DecisionRecommendation[] {
  const { hub, risks, snapshotLabel } = params;
  const recs: DecisionRecommendation[] = [];

  const has = (t: string) => risks.some((r) => r.type === t);

  if (hub === "buyer") {
    recs.push({
      title: "Best next action",
      detail: `Compare ${snapshotLabel} to your must-haves, then request a showing or broker intro when ready.`,
      impact: "medium",
    });
    if (has("price_anomaly")) {
      recs.push({
        title: "Financial warning",
        detail: "Validate list price against recent neighborhood sales before making an offer.",
        impact: "high",
      });
    } else {
      recs.push({
        title: "Financial check",
        detail: "Stress-test monthly carrying costs including taxes and insurance.",
        impact: "low",
      });
    }
  }

  if (hub === "seller") {
    recs.push({
      title: "Publish readiness",
      detail: "Complete photos, declaration, and documents checklist before promoting the listing.",
      impact: "high",
    });
    recs.push({
      title: "Pricing",
      detail: "Refresh comps monthly; small price adjustments can change inquiry volume.",
      impact: "low",
    });
  }

  if (hub === "bnhub" || hub === "rent") {
    recs.push({
      title: "Guest / host alignment",
      detail: "Confirm house rules, fees, and cancellation policy match guest expectations.",
      impact: "medium",
    });
    if (risks.length === 0) {
      recs.push({
        title: "Optimization",
        detail: "Update calendar and turn-night minimums for upcoming holidays.",
        impact: "low",
      });
    }
  }

  if (hub === "broker") {
    recs.push({
      title: "Lead follow-up",
      detail: "Log outcome in CRM after each touch; schedule next step within 24h for hot leads.",
      impact: "high",
    });
    recs.push({
      title: "Deal hygiene",
      detail: "Align milestones with lender and inspection dates to avoid last-minute delays.",
      impact: "medium",
    });
  }

  if (hub === "mortgage") {
    recs.push({
      title: "Documentation",
      detail: "Collect T4/pay stubs, letter of employment, and liability statements early.",
      impact: "high",
    });
    recs.push({
      title: "Approval likelihood",
      detail: "Pre-qualification is not approval — lock documentation before rate shopping.",
      impact: "medium",
    });
  }

  if (hub === "investor") {
    recs.push({
      title: "Market signal",
      detail: "Cross-check platform growth metrics with your own segment assumptions.",
      impact: "medium",
    });
    recs.push({
      title: "Revenue risk",
      detail: "Watch concentration: single-hub revenue spikes may be seasonal.",
      impact: "low",
    });
  }

  if (hub === "admin") {
    recs.push({
      title: "Operations",
      detail: "Triage disputes and payout blocks before batch finance exports.",
      impact: "critical",
    });
    recs.push({
      title: "Anomaly review",
      detail: "Spot-check high-value bookings and refund patterns weekly.",
      impact: "high",
    });
  }

  return recs;
}

export function pickNextBestAction(
  recs: DecisionRecommendation[],
  risks: DecisionRiskItem[],
  hub?: AiHub
): string {
  const criticalRisk = risks.find((r) => r.severity === "critical");
  if (criticalRisk) return criticalRisk.suggestedAction;
  const highRec = recs.find((r) => r.impact === "critical" || r.impact === "high");
  if (highRec) return highRec.detail;
  const highRisk = risks.find((r) => r.severity === "high");
  if (highRisk) return highRisk.suggestedAction;
  return recs[0]?.detail ?? hubFallbackAction(hub);
}

export function confidenceFromCompleteness(params: {
  riskCount: number;
  recCount: number;
  hasEntity: boolean;
}): number {
  let score = 88;
  if (!params.hasEntity) score -= 15;
  score -= Math.min(30, params.riskCount * 6);
  score += Math.min(10, params.recCount * 2);
  return Math.max(42, Math.min(96, Math.round(score)));
}

export function summarizeDecision(params: {
  hub: AiHub;
  entityLabel: string;
  priorityLevel: PriorityLevel;
  riskCount: number;
}): string {
  const { entityLabel, priorityLevel, riskCount } = params;
  const tier =
    priorityLevel === "critical" || priorityLevel === "high"
      ? "needs attention now"
      : priorityLevel === "medium"
        ? "worth a focused review"
        : "routine follow-up";
  const n = riskCount;
  return `${entityLabel}: ${n} factor${n === 1 ? "" : "s"} scanned — ${tier}. Confirm against your own data before you commit.`;
}

/** Safe default when evaluation throws — UI must never break. */
export function fallbackDecisionResult(hub: AiHub): DecisionEngineResult {
  const risks: DecisionRiskItem[] = [
    {
      type: "engine_unavailable",
      severity: "low",
      explanation: "The decision engine could not complete this check. You can continue manually.",
      suggestedAction: "Refresh the page or try again in a few minutes.",
    },
  ];
  const recommendations = recommendationsForContext({
    hub,
    risks,
    snapshotLabel: "Session",
  });
  const priorityLevel: PriorityLevel = "medium";
  return {
    summary: `Decision assist is temporarily limited for ${hub}. Review items manually until the check completes.`,
    risks,
    recommendations,
    priorityLevel,
    nextBestAction: pickNextBestAction(recommendations, risks, hub),
    confidenceScore: 45,
    decisionType: decisionTypeForHub(hub),
    reasoning:
      "Fallback path: evaluation error or incomplete data. No automated actions were taken.",
  };
}
