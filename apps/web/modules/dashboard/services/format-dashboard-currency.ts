const cad = new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 });

export function formatCadFromCents(cents: number): string {
  return cad.format(cents / 100);
}

export function formatCadCompactFromCents(cents: number): string {
  const n = cents / 100;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return cad.format(n);
}

/** Humanize monthly rent / cashflow from cents. */
export function formatMonthlyFromCents(cents: number | null | undefined): string {
  if (cents == null || cents <= 0) return "—";
  return `${formatCadFromCents(cents)} / mo`;
}
