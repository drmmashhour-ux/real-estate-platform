import {
  DEFAULT_COUNTRY_SLUG,
  getCountryBySlug,
  isCountrySlug,
  isLocaleAllowedForCountry,
  ROUTED_COUNTRY_SLUGS,
  type CountryCodeLower,
} from "@/config/countries";
import { routing } from "@/i18n/routing";

/**
 * Strips the leading `/{locale}` segment (e.g. `/fr/ca/listings` → `/ca/listings`).
 */
export function stripLocalePrefix(pathname: string): string {
  for (const loc of routing.locales) {
    const prefix = `/${loc}`;
    if (pathname === prefix) return "/";
    if (pathname.startsWith(`${prefix}/`)) return pathname.slice(prefix.length) || "/";
  }
  return pathname;
}

/**
 * Strips `/{country}` when present (path must already be locale-stripped).
 * `/ca/listings` → `/listings`; `/` → `/`.
 */
export function stripCountryPrefix(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return "/";
  const first = parts[0]?.toLowerCase();
  if (first && isCountrySlug(first)) {
    const rest = parts.slice(1);
    if (rest.length === 0) return "/";
    return `/${rest.join("/")}`;
  }
  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

/** App-relative path: `/listings` without locale or country. */
export function appPathnameFromUrl(pathname: string): string {
  return stripCountryPrefix(stripLocalePrefix(pathname));
}

/** Returns the locale segment from the pathname, or the default locale. */
export function localeFromPathname(pathname: string): (typeof routing.locales)[number] {
  for (const loc of routing.locales) {
    const prefix = `/${loc}`;
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) return loc;
  }
  return routing.defaultLocale;
}

/** Country slug from URL, or null if missing / invalid. */
export function countryFromPathname(pathname: string): CountryCodeLower | null {
  const afterLocale = stripLocalePrefix(pathname);
  const parts = afterLocale.split("/").filter(Boolean);
  const first = parts[0]?.toLowerCase();
  if (first && isCountrySlug(first)) return first;
  return null;
}

/**
 * If the path after locale does not start with a routed country segment, returns the pathname
 * that inserts the default country: `/en/listings` → `/en/ca/listings`.
 */
export function ensureCountryInPathname(pathname: string, defaultCountry: CountryCodeLower = DEFAULT_COUNTRY_SLUG): string | null {
  const loc = localeFromPathname(pathname);
  const afterLocale = stripLocalePrefix(pathname);
  const parts = afterLocale.split("/").filter(Boolean);
  const first = parts[0]?.toLowerCase();
  if (first && isCountrySlug(first) && ROUTED_COUNTRY_SLUGS.includes(first as CountryCodeLower)) {
    return null;
  }
  /** Inactive country slug (e.g. Syria before launch): rewrite to default country, keep rest of path. */
  if (first && isCountrySlug(first) && !ROUTED_COUNTRY_SLUGS.includes(first as CountryCodeLower)) {
    const tail = parts.slice(1);
    const tailPath = tail.length ? `/${tail.join("/")}` : "/";
    return `/${loc}/${defaultCountry}${tailPath === "/" ? "" : tailPath}`;
  }
  const rest = afterLocale === "/" ? "" : afterLocale;
  const insert = defaultCountry;
  if (rest === "/" || rest === "") {
    return `/${loc}/${insert}`;
  }
  return `/${loc}/${insert}${rest}`;
}

export function resolveCountrySlugOrDefault(pathname: string): CountryCodeLower {
  return countryFromPathname(pathname) ?? DEFAULT_COUNTRY_SLUG;
}

/** Validates locale ↔ country (e.g. Arabic only for Syria). Returns redirect pathname or null. */
export function localeCountryMismatchRedirect(pathname: string): string | null {
  const loc = localeFromPathname(pathname);
  const slug = countryFromPathname(pathname);
  if (!slug) return null;
  const def = getCountryBySlug(slug);
  if (!def) return null;
  if (isLocaleAllowedForCountry(loc, def)) return null;
  const fallbackLocale = def.defaultLanguage;
  const afterLocale = stripLocalePrefix(pathname);
  return `/${fallbackLocale}${afterLocale === "/" ? "" : afterLocale}`;
}
