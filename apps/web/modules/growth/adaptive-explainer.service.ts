/**
 * Attach explicit “why it matters” strings — correlational framing only.
 */

import type { AdaptiveDecision } from "@/modules/growth/adaptive-intelligence.types";

export function attachAdaptiveExplanations(decisions: AdaptiveDecision[]): AdaptiveDecision[] {
  return decisions.map((d) => ({
    ...d,
    whyItMatters: explainWhy(d),
  }));
}

function explainWhy(d: AdaptiveDecision): string {
  switch (d.category) {
    case "timing":
      return "Slow replies correlate with drop-off in short windows — this nudge prioritizes responsiveness, not guaranteed conversion.";
    case "closing":
      return "Highest-scored leads concentrate pipeline upside; revisiting them first is conservative portfolio thinking, not a forecast.";
    case "retention":
      return "Broker-side dependence indices help spot relationship risk early — engagement is preventive, not contractual.";
    case "routing":
      return "Matching high-score intake with proven broker tiers uses existing tier signals — operators still decide assignments.";
    case "growth":
      return "City concentration shows where demand showed up in CRM — validate with listings/staffing before shifting budget.";
    default:
      return "Advisory prioritization from stored CRM + growth telemetry — confirm facts in CRM before acting.";
  }
}
