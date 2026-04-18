export function formatCents(cents: number, currency = "CAD"): string {
  return `${(cents / 100).toLocaleString(undefined, { style: "currency", currency })}`;
}
