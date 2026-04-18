/** `numberingLocale`: BCP 47 tag for digits/grouping (e.g. `ar-SY`, `en-US`). */
export function money(
  amount: string | number | { toString(): string },
  currency = "SYP",
  numberingLocale = "en-US",
) {
  const raw = typeof amount === "object" && amount !== null ? amount.toString() : String(amount);
  const n = Number(raw);
  const formatted = Number.isFinite(n)
    ? n.toLocaleString(numberingLocale.startsWith("ar") ? "ar-SY" : numberingLocale, {
        maximumFractionDigits: 0,
      })
    : raw;
  return `${currency} ${formatted}`;
}
