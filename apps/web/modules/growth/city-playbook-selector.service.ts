/**
 * Picks a reference “top” city from Fast Deal comparison — conservative gates only.
 */

import type { FastDealCityComparison, FastDealCityRankEntry } from "@/modules/growth/fast-deal-city-comparison.types";

/** Minimum attributed events to treat a city as a replication reference. */
export const TOP_CITY_MIN_SAMPLE_SIZE = 25;

export type SelectTopPerformingCityResult =
  | { top: FastDealCityRankEntry; warning?: undefined }
  | { top: null; warning: string };

/**
 * Highest `performanceScore` among cities that meet confidence + sample thresholds.
 * Eligible rows are sorted by score descending — input order does not matter.
 */
export function selectTopPerformingCity(
  cityComparison: FastDealCityComparison | null | undefined,
): SelectTopPerformingCityResult {
  if (!cityComparison?.rankedCities?.length) {
    return { top: null, warning: "No city comparison data — cannot select a reference city." };
  }

  const eligible = cityComparison.rankedCities
    .filter(
      (c) =>
        (c.confidence === "medium" || c.confidence === "high") &&
        c.meta.sampleSize >= TOP_CITY_MIN_SAMPLE_SIZE,
    )
    .sort((a, b) => b.performanceScore - a.performanceScore);

  if (!eligible.length) {
    return {
      top: null,
      warning: `No city meets minimum confidence (medium or higher) and sample size (≥ ${TOP_CITY_MIN_SAMPLE_SIZE}).`,
    };
  }

  return { top: eligible[0] };
}
