/**
 * Display helpers — settlement still uses listing/host currency in BNHub.
 */
export function formatMoney(amountCents: number, currency: string, locale?: string): string {
  const cur = currency.toUpperCase();
  const loc = locale ?? (cur === "CAD" ? "en-CA" : cur === "EUR" ? "fr-FR" : "en-US");
  try {
    return new Intl.NumberFormat(loc, {
      style: "currency",
      currency: cur.length === 3 ? cur : "USD",
      maximumFractionDigits: 0,
    }).format(amountCents / 100);
  } catch {
    return `${(amountCents / 100).toFixed(2)} ${cur}`;
  }
}

/** Stub FX hook — replace with ECB/Stripe rates service when wired. */
export function convertCentsStub(amountCents: number, _from: string, _to: string): number {
  return amountCents;
}
