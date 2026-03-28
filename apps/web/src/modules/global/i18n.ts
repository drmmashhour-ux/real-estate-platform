export const SUPPORTED_LOCALES = ["en-CA", "en-US", "fr-CA", "fr-FR", "en-GB"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export function resolveLocale(acceptLanguage: string | null, fallback: string): string {
  if (!acceptLanguage?.trim()) return fallback;
  const first = acceptLanguage.split(",")[0]?.trim()?.split(";")[0]?.trim();
  if (!first) return fallback;
  const lower = first.toLowerCase();
  for (const loc of SUPPORTED_LOCALES) {
    if (loc.toLowerCase() === lower || loc.toLowerCase().startsWith(lower.slice(0, 2))) {
      return loc;
    }
  }
  return fallback;
}

export function localeForCountry(countryCode: string): string {
  const c = countryCode.toUpperCase();
  if (c === "CA") return "en-CA";
  if (c === "US") return "en-US";
  if (c === "FR") return "fr-FR";
  if (c === "GB") return "en-GB";
  return "en-US";
}
