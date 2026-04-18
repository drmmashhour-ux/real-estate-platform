/** Normalizes display strings for draft preview only — not for legal filing. */
export function normalizeCurrencyCad(cents: number): string {
  return (cents / 100).toLocaleString("fr-CA", { style: "currency", currency: "CAD" });
}
