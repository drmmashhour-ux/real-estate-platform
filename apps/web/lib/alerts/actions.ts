import type { WatchlistAlertType } from "@prisma/client";

/** Map platform alert enums to deterministic action templates (merged with LLM output). */
export function buildAlertSuggestedActions(alertType: string): string[] {
  const t = alertType as WatchlistAlertType;

  switch (t) {
    case "price_changed":
      return [
        "Re-run deal analysis for this listing with the updated price.",
        "Compare the new price to recent neighborhood comps if available.",
        "If you use rent assumptions, check whether cap rate or cashflow changed.",
      ];
    case "strong_opportunity_detected":
      return [
        "Open the listing and review full deal metrics and risk flags.",
        "Add to watchlist or shortlist if it fits your strategy.",
        "Run investor underwriting before any commitment.",
      ];
    case "deal_score_up":
    case "confidence_up":
      return [
        "Review what improved in scores (deal, trust, or model confidence).",
        "Check whether neighborhood or listing signals shifted.",
        "Update your buy box or saved search if the edge case repeats.",
      ];
    case "deal_score_down":
    case "confidence_down":
    case "needs_review_detected":
      return [
        "Review what deteriorated — trust, fraud signals, or model confidence.",
        "Open comparables or appraisal-style context if you rely on valuation.",
        "Decide whether to pause, watch, or dismiss after manual review.",
      ];
    case "trust_score_changed":
    case "fraud_risk_up":
      return [
        "Read trust / fraud context carefully before engaging.",
        "Verify listing evidence and seller disclosures.",
        "Escalate to compliance or broker review if required by policy.",
      ];
    case "listing_status_changed":
      return [
        "Confirm current listing status and availability.",
        "Remove or adjust pipeline stages if you track this property.",
        "Refresh analysis if status affects pricing or rent assumptions.",
      ];
    default:
      return [
        "Read the alert and open the related listing.",
        "Validate metrics with current platform data.",
        "Decide if deeper analysis (deal analyzer, appraisal tools) is warranted.",
      ];
  }
}
