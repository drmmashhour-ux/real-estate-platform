function resolveNumberLocale(locale?: string): string {
  if (!locale || typeof locale !== "string") return "en-US";
  return locale.toLowerCase().startsWith("ar") ? "ar-SY" : "en-US";
}

/** `numberingLocale`: BCP 47 tag for digits/grouping (e.g. `ar-SY`, `en-US`). */
/** Locale-aware money string for UI (SYP + grouped amount). */
export function formatSyriaCurrency(
  amount: string | number | { toString(): string },
  currency = "SYP",
  localeHint?: string,
): string {
  return money(amount, currency, resolveNumberLocale(localeHint));
}

export function money(
  amount: string | number | { toString(): string },
  currency = "SYP",
  numberingLocale = "en-US",
) {
  const raw = typeof amount === "object" && amount !== null ? amount.toString() : String(amount);
  const n = Number(raw);
  const loc = resolveNumberLocale(numberingLocale);
  const formatted = Number.isFinite(n)
    ? n.toLocaleString(loc, {
        maximumFractionDigits: 0,
      })
    : raw;
  return `${currency} ${formatted}`;
}

/** Deterministic grouping — Arabic UI uses Eastern Arabic numerals via ar-SY locale where supported. */
export function formatSyriaNumber(value: number, localeHint?: string): string {
  try {
    const n = Number(value);
    if (!Number.isFinite(n)) return String(value);
    const loc = resolveNumberLocale(localeHint);
    return n.toLocaleString(loc, { maximumFractionDigits: 2 });
  } catch {
    return String(value);
  }
}

export function formatSyriaDate(
  input: Date | string | number,
  localeHint?: string,
  opts?: Intl.DateTimeFormatOptions,
): string {
  try {
    const d = input instanceof Date ? input : new Date(input);
    if (Number.isNaN(d.getTime())) return "";
    const loc = resolveNumberLocale(localeHint);
    return d.toLocaleDateString(loc, opts ?? { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return "";
  }
}
