/**
 * Locale + currency display helpers — driven by country rows, not hardcoded ISO maps.
 */

const AR_FUTURE = "ar";

/** Resolve best locale for UI from user preference and country-supported list. */
export function resolveLocale(
  preferred: string | null | undefined,
  supportedLocales: string[],
  defaultLocale: string
): string {
  const sup = supportedLocales.map((s) => s.toLowerCase());
  const def = (defaultLocale || "en").toLowerCase();
  if (!preferred?.trim()) return sup.includes(def) ? def : sup[0] ?? "en";
  const p = preferred.trim().toLowerCase();
  if (sup.includes(p)) return p;
  const short = p.split("-")[0] ?? p;
  const match = sup.find((s) => s === short || s.startsWith(`${short}-`));
  return match ?? (sup.includes(def) ? def : sup[0] ?? "en");
}

/** Whether Arabic should be offered in language switchers (country config or explicit `ar` in supported list). */
export function isArabicSupported(supportedLocales: string[]): boolean {
  return supportedLocales.some((l) => l.toLowerCase() === AR_FUTURE || l.toLowerCase().startsWith("ar-"));
}

/** Format minor units (e.g. cents) for display using Intl. */
export function formatMinorUnits(
  minorAmount: number,
  currencyCode: string,
  locale: string
): string {
  const cur = currencyCode.trim().toUpperCase();
  const major = minorAmount / 100;
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: cur,
      maximumFractionDigits: 2,
    }).format(major);
  } catch {
    return `${major.toFixed(2)} ${cur}`;
  }
}
