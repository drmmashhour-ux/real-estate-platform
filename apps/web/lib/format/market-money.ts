import type { ResolvedMarket } from "@/lib/markets";

/**
 * Locale- and market-aware money formatting. Falls back to plain number + code if `Intl` rejects the pair.
 */
export function formatMoneyAmount(params: {
  amountCents: number;
  currency: string;
  localeBcp47: string;
  maximumFractionDigits?: number;
}): string {
  const { amountCents, currency, localeBcp47, maximumFractionDigits = 2 } = params;
  const amount = amountCents / 100;
  try {
    return new Intl.NumberFormat(localeBcp47, {
      style: "currency",
      currency: currency.toUpperCase(),
      maximumFractionDigits,
      minimumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount.toFixed(maximumFractionDigits)} ${currency.toUpperCase()}`;
  }
}

export function formatMoneyForMarket(
  amountCents: number,
  market: Pick<ResolvedMarket, "defaultCurrency">,
  localeBcp47: string,
): string {
  const digits = market.defaultCurrency.toUpperCase() === "SYP" ? 0 : 2;
  return formatMoneyAmount({
    amountCents,
    currency: market.defaultCurrency,
    localeBcp47,
    maximumFractionDigits: digits,
  });
}
