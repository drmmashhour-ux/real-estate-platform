import { cookies, headers } from "next/headers";
import {
  DEFAULT_COUNTRY_SLUG,
  isCountrySlug,
  ROUTED_COUNTRY_SLUGS,
  type CountryCodeLower,
} from "@/config/countries";
import { COUNTRY_COOKIE } from "@/lib/region/country-cookie";

export const LECIPM_COUNTRY_HEADER = "x-lecipm-country";

/** Server Components / Route handlers: country from middleware header, then cookie (API paths often omit the header). */
export async function getRequestCountrySlug(): Promise<CountryCodeLower> {
  const h = await headers();
  const raw = h.get(LECIPM_COUNTRY_HEADER)?.trim().toLowerCase();
  if (raw && isCountrySlug(raw)) return raw;
  const fromCookie = (await cookies()).get(COUNTRY_COOKIE)?.value?.trim().toLowerCase();
  if (
    fromCookie &&
    isCountrySlug(fromCookie) &&
    ROUTED_COUNTRY_SLUGS.includes(fromCookie as CountryCodeLower)
  ) {
    return fromCookie as CountryCodeLower;
  }
  return DEFAULT_COUNTRY_SLUG;
}
