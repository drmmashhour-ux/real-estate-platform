/** Display helper — avoids implying false precision beyond whole dollars at admin scale. */
export function formatCentsAbbrev(cents: number, currency = "CAD"): string {
  if (!Number.isFinite(cents)) return "—";
  const dollars = cents / 100;
  if (Math.abs(dollars) >= 1_000_000) return `${currency} ${(dollars / 1_000_000).toFixed(2)}M`;
  if (Math.abs(dollars) >= 1000) return `${currency} ${(dollars / 1000).toFixed(1)}k`;
  return `${currency} ${Math.round(dollars).toLocaleString()}`;
}
