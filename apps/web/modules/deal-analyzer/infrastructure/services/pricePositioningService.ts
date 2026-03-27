import { dealAnalyzerConfig } from "@/config/dealAnalyzer";
import {
  PricePositioningOutcome,
  type ComparableWithScore,
  type ComparablePositioningResult,
} from "@/modules/deal-analyzer/domain/comparables";

function median(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  if (s.length % 2 === 1) return s[mid];
  return (s[mid - 1]! + s[mid]!) / 2;
}

/**
 * Classifies subject list price vs comparable **platform listings** — not an appraisal.
 */
export function computePricePositioning(args: {
  subjectPriceCents: number;
  comparables: ComparableWithScore[];
  overrides?: {
    minGoodComps?: number;
    minCompsForMediumConfidence?: number;
  };
}): ComparablePositioningResult {
  const minGood = args.overrides?.minGoodComps ?? dealAnalyzerConfig.comparable.minGoodComps;
  const minMedium =
    args.overrides?.minCompsForMediumConfidence ?? dealAnalyzerConfig.comparable.minCompsForMediumConfidence;

  const sorted = [...args.comparables].sort((a, b) => b.similarityScore - a.similarityScore);
  const top = sorted.filter((c) => c.similarityScore >= 0.35);
  const prices = top.map((c) => c.priceCents).filter((p) => p > 0);

  const reasons: string[] = [];
  const warnings: string[] = [];

  if (prices.length < minGood) {
    warnings.push(
      `Only ${prices.length} comparable listings met similarity thresholds — positioning is indicative, not a valuation.`,
    );
    return {
      outcome: PricePositioningOutcome.INSUFFICIENT_COMPARABLE_DATA,
      confidenceLevel: "low",
      subjectPriceCents: args.subjectPriceCents,
      comparableCount: prices.length,
      priceRangeCents: prices.length ? { low: Math.min(...prices), high: Math.max(...prices) } : null,
      medianPriceCents: median(prices),
      reasons: [
        "Insufficient comparable listings after deterministic filters — price positioning cannot be asserted with confidence.",
      ],
      warnings,
    };
  }

  const low = Math.min(...prices);
  const high = Math.max(...prices);
  const med = median(prices);

  const avgSim =
    top.reduce((acc, c, i) => acc + c.similarityScore * (i < minMedium ? 1 : 0.85), 0) /
    Math.max(1, top.length);
  let confidence: "low" | "medium" | "high" = "low";
  if (prices.length >= minMedium && avgSim >= dealAnalyzerConfig.comparable.minAvgSimilarityForHighConfidence) {
    confidence = "high";
  } else if (prices.length >= minGood) {
    confidence = "medium";
  }

  if (avgSim < dealAnalyzerConfig.comparable.minAvgSimilarityForHighConfidence) {
    warnings.push("Average comparable similarity is moderate — treat range as broad, not precise.");
  }

  let outcome: (typeof PricePositioningOutcome)[keyof typeof PricePositioningOutcome];
  if (args.subjectPriceCents < low) {
    outcome = PricePositioningOutcome.BELOW_COMPARABLE_RANGE;
    reasons.push("List price sits below the filtered comparable price band on this platform.");
  } else if (args.subjectPriceCents > high) {
    outcome = PricePositioningOutcome.ABOVE_COMPARABLE_RANGE;
    reasons.push("List price sits above the filtered comparable price band on this platform.");
  } else {
    outcome = PricePositioningOutcome.WITHIN_COMPARABLE_RANGE;
    reasons.push("List price falls within the filtered comparable price band on this platform.");
  }

  reasons.push(
    `Based on ${prices.length} comparable listings (deterministic filters; not an appraisal).`,
  );

  return {
    outcome,
    confidenceLevel: confidence,
    subjectPriceCents: args.subjectPriceCents,
    comparableCount: prices.length,
    priceRangeCents: { low, high },
    medianPriceCents: med,
    reasons,
    warnings,
  };
}
