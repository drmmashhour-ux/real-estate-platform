/** Percent change vs prior value (0 when prior is 0 or missing). */
export function computeTrend(current: number, previous: number | null | undefined): number {
  if (previous == null || !Number.isFinite(previous) || previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

export function formatTrendPct(delta: number): string {
  if (!Number.isFinite(delta) || delta === 0) return "0%";
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta.toFixed(1)}%`;
}
