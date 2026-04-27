/**
 * Calendar season buckets for time-based **recommendations** (no DB writes).
 * Normal = months not in high or low season lists.
 */
export type SeasonType = "normal" | "high_season" | "low_season";

const HIGH_SEASON_MONTHS = new Set([6, 7, 8, 12]);
const LOW_SEASON_MONTHS = new Set([1, 2, 3]);

/**
 * @param month1to12 1=January … 12=December
 */
export function getSeasonTypeForMonth(month1to12: number): SeasonType {
  if (HIGH_SEASON_MONTHS.has(month1to12)) return "high_season";
  if (LOW_SEASON_MONTHS.has(month1to12)) return "low_season";
  return "normal";
}

/**
 * @param d Any date; uses local calendar month.
 */
export function getSeasonTypeForDate(d: Date): SeasonType {
  return getSeasonTypeForMonth(d.getMonth() + 1);
}
