import type { CurrencyDisplay } from "./global.types";

/** Example rates to CAD cents anchor — replace with FX service; display-only. */
const TO_CAD: Record<string, number> = {
  CAD: 1,
  USD: 1.36,
  SYP: 0.000034,
  EUR: 1.48,
  AED: 0.37,
};

function clampCents(n: number): number {
  return Math.round(n);
}

export function normalizeToCadCents(amountCents: number, currency: string): number {
  const cur = currency.toUpperCase();
  const rate = TO_CAD[cur] ?? 1;
  return clampCents(amountCents * rate);
}

export function formatCurrencyDisplay(
  amountCents: number,
  currency: string,
  displayLocale: string
): CurrencyDisplay {
  const cur = currency.toUpperCase();
  const formatted = new Intl.NumberFormat(displayLocale, {
    style: "currency",
    currency: cur,
    maximumFractionDigits: 0,
  }).format(amountCents / 100);

  return {
    amount: amountCents / 100,
    currency: cur,
    formatted,
    normalizedCents: normalizeToCadCents(amountCents, cur),
  };
}

/** Show approximate conversion for parallel display — same disclaimer as rates */
export function conversionFootnote(_from: string, _to: string): string {
  return "Indicative only — not a trading rate; use treasury-approved FX for contracts.";
}
