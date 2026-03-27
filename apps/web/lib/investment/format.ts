/** Display formatting for investment MVP (CAD + percentages). */

export { safeCurrency, safeCurrencyCAD, safeNumber, safePercent } from "@/lib/safe-format";

const DISPLAY_EM = "—";

export function formatCurrencyCAD(value: number): string {
  if (!Number.isFinite(value)) return DISPLAY_EM;
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatRoiPercent(value: number, fractionDigits = 2): string {
  if (!Number.isFinite(value)) return DISPLAY_EM;
  return `${value.toFixed(fractionDigits)}%`;
}

export function formatPercent(value: number, fractionDigits = 1): string {
  if (!Number.isFinite(value)) return DISPLAY_EM;
  return `${value.toFixed(fractionDigits)}%`;
}
