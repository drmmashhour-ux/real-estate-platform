import type { PropertyInput, SaleValuationResult, ValuationExplanation } from "./types";
import type { ComparableRecord } from "./types";
import { findComparableListings, summarizeComparables } from "./comparables";
import { computeConfidenceScore, getDataConfidenceNote } from "./confidence";
import type { PricePositionLabel } from "./constants";

/**
 * Sale valuation: estimate market value from comparables and property data.
 * Uses nearby listing prices as proxy when no sold data available.
 */
export async function computeSaleValuation(
  input: PropertyInput,
  currentListingPriceCents?: number | null
): Promise<SaleValuationResult> {
  const comparables = await findComparableListings(input, 10);
  const withPrice = comparables.filter((c) => c.nightlyRateCents != null || c.priceCents != null);

  let estimatedValueCents: number;
  if (withPrice.length > 0) {
    const prices = withPrice.map((c) => (c.priceCents ?? (c.nightlyRateCents! * 30)));
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const weights = withPrice.map((c) => c.weight);
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    const weightedAvg = withPrice.reduce(
      (s, c, i) => s + (c.priceCents ?? c.nightlyRateCents! * 30) * weights[i],
      0
    ) / totalWeight;
    estimatedValueCents = Math.round(weightedAvg);
  } else {
    estimatedValueCents = input.buildingAreaSqft
      ? Math.round(input.buildingAreaSqft * 200 * 100)
      : 300_000_00;
  }

  const rangePct = 0.12;
  const valueMinCents = Math.round(estimatedValueCents * (1 - rangePct));
  const valueMaxCents = Math.round(estimatedValueCents * (1 + rangePct));

  const { score: confidenceScore, label: confidenceLabel } = computeConfidenceScore({
    comparableCount: comparables.length,
    dataCompleteness: input.bedrooms != null && input.bathrooms != null ? 0.8 : 0.5,
    signalConsistency: withPrice.length >= 3 ? 0.8 : 0.5,
  });

  let positionLabel: PricePositionLabel = "fair";
  if (currentListingPriceCents != null) {
    const ratio = currentListingPriceCents / estimatedValueCents;
    if (ratio > 1.1) positionLabel = "overvalued";
    else if (ratio < 0.9) positionLabel = "undervalued";
  }

  const mainFactors: string[] = [
    "Location and city demand",
    "Comparable listings in the area",
    "Property type and size",
  ];
  const positiveFactors: string[] = [];
  const negativeFactors: string[] = [];
  if (comparables.length >= 5) positiveFactors.push("Strong set of comparables");
  else if (comparables.length < 2) negativeFactors.push("Few comparable listings");
  if (input.bedrooms != null && input.bathrooms != null) positiveFactors.push("Complete bedroom/bath data");
  if (positionLabel === "overvalued") negativeFactors.push("Listing price above estimated market value");
  if (positionLabel === "undervalued") positiveFactors.push("Listing price below estimated market value");

  const explanation: ValuationExplanation = {
    mainFactors,
    positiveFactors,
    negativeFactors,
    positionLabel,
    positionNote:
      positionLabel === "fair"
        ? "Listing price is within the estimated market range."
        : positionLabel === "overvalued"
          ? "Listing price is above the estimated market value range."
          : "Listing price is below the estimated market value range.",
    dataConfidenceNote: getDataConfidenceNote(confidenceLabel),
  };

  return {
    valuationType: "sale",
    estimatedValueCents,
    valueMinCents,
    valueMaxCents,
    confidenceScore,
    confidenceLabel,
    comparables,
    explanation,
    positionLabel,
  };
}
