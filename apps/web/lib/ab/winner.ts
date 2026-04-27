export type AbAggregateRow = {
  experiment: string | null;
  variant: string | null;
  exposures: string | number;
  conversions: string | number;
};

/**
 * Picks the row with the highest conversion rate (conversions / exposures).
 * Ties: first in sort order (caller should sort or compare rates explicitly if needed).
 */
export function pickWinner(data: AbAggregateRow[]): AbAggregateRow | undefined {
  if (!data.length) return undefined;
  return [...data].sort((a, b) => {
    const expA = Number(a.exposures) || 0;
    const expB = Number(b.exposures) || 0;
    const rateA = (Number(a.conversions) || 0) / Math.max(1, expA);
    const rateB = (Number(b.conversions) || 0) / Math.max(1, expB);
    return rateB - rateA;
  })[0];
}
