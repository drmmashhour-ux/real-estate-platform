import type { PropertyInput, LongTermRentValuationResult, ValuationExplanation } from "./types";
import { findComparableListings } from "./comparables";
import { computeConfidenceScore, getDataConfidenceNote } from "./confidence";

/**
 * Long-term rental valuation: estimate monthly rent from comparables.
 * Uses BNHUB nightly * 30 as proxy when no long-term rental comps.
 */
export async function computeLongTermRentValuation(input: PropertyInput): Promise<LongTermRentValuationResult> {
  const comparables = await findComparableListings(input, 10);
  const withRate = comparables.filter((c) => c.nightlyRateCents != null || c.monthlyRentCents != null);

  let monthlyRentEstimateCents: number;
  if (withRate.length > 0) {
    const monthlyFromNightly = (c: { nightlyRateCents?: number; monthlyRentCents?: number }) =>
      c.monthlyRentCents ?? (c.nightlyRateCents! * 30);
    const rents = withRate.map(monthlyFromNightly);
    const weights = withRate.map((c) => c.weight);
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    monthlyRentEstimateCents = Math.round(
      withRate.reduce((s, c, i) => s + monthlyFromNightly(c) * weights[i], 0) / totalWeight
    );
  } else {
    monthlyRentEstimateCents = input.bedrooms
      ? Math.round((1500 + input.bedrooms * 400) * 100)
      : 2000_00;
  }

  const rangePct = 0.15;
  const rentMinCents = Math.round(monthlyRentEstimateCents * (1 - rangePct));
  const rentMaxCents = Math.round(monthlyRentEstimateCents * (1 + rangePct));

  const { score: confidenceScore, label: confidenceLabel } = computeConfidenceScore({
    comparableCount: comparables.length,
    dataCompleteness: input.bedrooms != null ? 0.7 : 0.4,
    signalConsistency: withRate.length >= 3 ? 0.7 : 0.5,
  });

  const explanation: ValuationExplanation = {
    mainFactors: ["Local rental demand", "Comparable listings", "Bedrooms and amenities"],
    positiveFactors: withRate.length >= 5 ? ["Strong comparable set"] : [],
    negativeFactors: withRate.length < 2 ? ["Limited comparable data"] : [],
    dataConfidenceNote: getDataConfidenceNote(confidenceLabel),
  };

  return {
    valuationType: "long_term_rental",
    monthlyRentEstimateCents,
    rentMinCents,
    rentMaxCents,
    confidenceScore,
    confidenceLabel,
    comparables,
    explanation,
  };
}
