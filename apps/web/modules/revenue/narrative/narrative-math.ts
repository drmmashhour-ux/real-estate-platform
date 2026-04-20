export function percentChange(current: number, previous: number): number {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return 0;
  if (previous === 0 && current === 0) return 0;
  if (previous === 0) return 1;
  return (current - previous) / previous;
}

/** Display a fractional change or ratio as a whole-percent label (e.g. 0.12 → "12%"). */
export function formatPercent(value: number): string {
  return `${Math.round(Math.abs(value) * 100)}%`;
}

export function formatCurrency(value: number, currencyCode = "CAD"): string {
  const code = currencyCode?.length === 3 ? currencyCode : "CAD";
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: code,
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-CA").format(value || 0);
}

export function trendDirection(value: number): "up" | "down" | "flat" {
  if (value > 0.03) return "up";
  if (value < -0.03) return "down";
  return "flat";
}
