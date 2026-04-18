import { MarketplaceRankingScore } from "./marketplace-intelligence.types";

export function computeMarketplaceRankingScore(input: {
  listingId: string;
  qualityScore: number;
  trustScore: number;
  conversionScore?: number | null;
  priceFitScore?: number | null;
  freshnessScore?: number | null;
}): MarketplaceRankingScore {
  const conversion = input.conversionScore ?? 50;
  const priceFit = input.priceFitScore ?? 50;
  const freshness = input.freshnessScore ?? 50;

  const score =
    input.qualityScore * 0.28 +
    input.trustScore * 0.28 +
    conversion * 0.2 +
    priceFit * 0.14 +
    freshness * 0.1;

  const reasons: string[] = [];
  if (input.qualityScore >= 70) reasons.push("Good listing quality");
  if (input.trustScore >= 70) reasons.push("Strong trust indicators");
  if (conversion >= 60) reasons.push("Healthy conversion signal");
  if (priceFit >= 60) reasons.push("Competitive pricing fit");
  if (freshness >= 60) reasons.push("Fresh marketplace activity");

  const knownFields = [
    input.qualityScore,
    input.trustScore,
    input.conversionScore,
    input.priceFitScore,
    input.freshnessScore,
  ].filter((x) => typeof x === "number").length;

  return {
    listingId: input.listingId,
    score: Number(score.toFixed(2)),
    confidence: Math.min(1, 0.45 + knownFields * 0.1),
    components: {
      quality: input.qualityScore,
      trust: input.trustScore,
      conversion,
      priceFit,
      freshness,
    },
    reasons,
    createdAt: new Date().toISOString(),
  };
}
