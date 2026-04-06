import type { ListingLearningStats } from "@prisma/client";
import type { ListingLearningFeatures } from "@/lib/learning/types";

export type RankingExplanation = {
  label: string;
  detail?: string;
};

/**
 * Explainable copy only — must map to real stats / features, no fabricated demand.
 */
export function getRankingExplanation(args: {
  features: ListingLearningFeatures;
  stats: ListingLearningStats | null;
  contextMatch: number;
  searchCity?: string | null;
}): RankingExplanation {
  const { features, stats, contextMatch, searchCity } = args;

  if (stats && stats.engagementCount30d >= MIN_FOR_COPY && stats.behaviorScore >= 0.62) {
    return { label: "Popular with similar searchers", detail: "Strong engagement in recent activity" };
  }

  if (searchCity?.trim() && features.city.toLowerCase().includes(searchCity.trim().toLowerCase())) {
    return { label: "Strong match for your filters", detail: `In ${features.city}` };
  }

  if (stats && stats.recentTrendScore >= 0.58) {
    return { label: "Recently trending in this category", detail: "Based on recent interest signals" };
  }

  if (contextMatch >= 0.62) {
    return { label: "Aligned with your browsing pattern", detail: "Light personalization boost" };
  }

  const med = medianHint(features.nightPriceCents);
  if (med === "value") {
    return { label: "Competitive price for this area", detail: `Bucket ${features.priceBucket}` };
  }

  return { label: "Balanced pick for this search", detail: "Rank blends quality, behavior, and fit" };
}

const MIN_FOR_COPY = 6;

function medianHint(cents: number): "value" | "typical" | "premium" {
  const n = cents / 100;
  if (n < 95) return "value";
  if (n < 220) return "typical";
  return "premium";
}
