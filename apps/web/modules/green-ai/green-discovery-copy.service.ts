import type { GreenSearchResultDecoration } from "./green-search.types";

/**
 * Short, policy-safe public lines — not guarantees, not official programs.
 */
export function greenDiscoveryLine(d: GreenSearchResultDecoration, kind: "search" | "card"): string {
  if (d.currentScore != null && d.currentScore >= 72) {
    return "Strong current modeled green performance (Québec-inspired score).";
  }
  if (d.improvementPotential === "high" && (d.scoreDelta ?? 0) > 0) {
    return "Meaningful upgrade potential — see modeled uplift vs current (not a guarantee).";
  }
  if (d.hasPotentialIncentives) {
    return "Potential published incentive pathway — always verify eligibility and amounts with official programs.";
  }
  if (d.efficientHeating === true) {
    return "Higher-efficiency heating profile in our modeled data.";
  }
  if (d.highInsulation === true) {
    return "Stronger insulation / envelope profile in the modeled data.";
  }
  if (kind === "search") {
    return "Québec-inspired green context available — not an official rating.";
  }
  return "Improved buyer positioning can come from well-documented retrofits — not automatic.";
}

export const GREEN_COPY = {
  disclaimerShort:
    "Québec-inspired model only — not EnerGuide, Rénoclimat, or a government label.",
} as const;

export function lineUpgradesNudge(d: GreenSearchResultDecoration | null | undefined): string {
  if (!d) return "Add green details to unlock modeled upgrade and incentive hints.";
  if (d.computedOnTheFly) return "Scoring used partial inputs — add heating/envelope for tighter fit.";
  return "Upgrade signals are assistive, not a bid or a quote.";
}
