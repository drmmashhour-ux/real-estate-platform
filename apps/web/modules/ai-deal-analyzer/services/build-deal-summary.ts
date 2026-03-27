import type { DealAnalyzerInput, DealConfidence, DealMetricBlock } from "./types";
import { simpleAffordabilityEstimate } from "./calculate-deal-metrics";

export function buildDealSummary(
  input: DealAnalyzerInput,
  metrics: DealMetricBlock,
  score: number,
  confidence: DealConfidence
): string {
  const parts: string[] = [];

  if (input.priceIsIllustrative) {
    parts.push(
      "The modeled price is illustrative only (derived from listing data) and should not be treated as an appraisal or market valuation."
    );
  }

  const confPhrase =
    confidence === "low"
      ? "Several important inputs are missing, so this analysis should be treated as preliminary."
      : confidence === "medium"
        ? "Some inputs are assumed, so treat the result as directional rather than exact."
        : "Enough inputs are present for a reasonable directional view, but this is still not underwriting.";

  parts.push(confPhrase);

  if (metrics.grossYield != null) {
    parts.push(
      `At the assumed numbers, estimated gross yield is about ${metrics.grossYield.toFixed(1)}% of the modeled price.`
    );
  } else {
    parts.push("Gross yield cannot be estimated without a rental income assumption.");
  }

  const afford = simpleAffordabilityEstimate(
    input.estimatedRent,
    metrics.monthlyMortgagePayment,
    metrics.estimatedMonthlyExpenses
  );
  if (afford === "tight") {
    parts.push("Monthly debt and expense load relative to assumed rent looks tight.");
  } else if (afford === "comfortable") {
    parts.push("Under the assumptions, monthly debt and expense load relative to rent looks manageable.");
  }

  if (metrics.estimatedMonthlyCashFlow != null) {
    if (metrics.estimatedMonthlyCashFlow > 0) {
      parts.push("Estimated monthly cash flow is positive under the stated assumptions.");
    } else {
      parts.push("Estimated monthly cash flow is not positive under the stated assumptions.");
    }
  }

  const tone =
    score >= 68
      ? "Overall, the deal looks moderately attractive on these illustrative numbers."
      : score >= 45
        ? "Overall, the deal looks mixed — some areas warrant a closer look before any decision."
        : "Overall, the deal looks challenging on these illustrative numbers; validate assumptions carefully.";

  parts.push(tone);

  return parts.join(" ");
}
