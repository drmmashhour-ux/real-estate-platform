/** localStorage SEO city overrides — client-only; must not import `seo-city-pages.service` (`@/lib/db`). */

import type { CitySlug } from "@/lib/geo/city-search";
import type { SeoPageOverrides } from "./seo-city.types";

const OVERRIDE_KEY = "lecipm-seo-city-overrides-v1";

function readOverridesClient(country: string, slug: CitySlug, kind: string): SeoPageOverrides | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const r = localStorage.getItem(OVERRIDE_KEY);
    if (!r) return null;
    const all = JSON.parse(r) as Record<string, SeoPageOverrides>;
    return all[`${country}:${slug}:${kind}`] ?? null;
  } catch {
    return null;
  }
}

export const readSeoCityOverrides = readOverridesClient;

export function writeSeoCityOverrideClient(
  country: string,
  slug: CitySlug,
  kind: string,
  patch: SeoPageOverrides
): void {
  if (typeof localStorage === "undefined") return;
  try {
    const r = localStorage.getItem(OVERRIDE_KEY);
    const all = (r ? JSON.parse(r) : {}) as Record<string, SeoPageOverrides>;
    all[`${country}:${slug}:${kind}`] = { ...all[`${country}:${slug}:${kind}`], ...patch };
    localStorage.setItem(OVERRIDE_KEY, JSON.stringify(all));
  } catch {
    /* quota */
  }
}
