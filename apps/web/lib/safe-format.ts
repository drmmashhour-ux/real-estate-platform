/**
 * Numeric guards for dashboards and finance (demo + production).
 * Use with formatters to avoid NaN/Infinity in UI.
 */

export function safeNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

export function safeCurrencyCAD(value: unknown): string {
  const n = safeNumber(value, NaN);
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(n);
}

/** Alias — same as `safeCurrencyCAD`. */
export const safeCurrency = safeCurrencyCAD;

export function safePercent(value: unknown, fractionDigits = 1): string {
  const n = safeNumber(value, NaN);
  if (!Number.isFinite(n)) return "—";
  return `${n.toFixed(fractionDigits)}%`;
}
