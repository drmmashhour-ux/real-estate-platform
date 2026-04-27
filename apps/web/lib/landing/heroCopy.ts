import type { UserBehaviorType } from "@/lib/ai/userProfile";
import type { TrustSignals } from "@/lib/market/trustSignals";

const DEFAULT_HEADLINE = "Smarter real estate starts here";
const DEFAULT_SUBCOPY =
  "Discover listings optimized with pricing intelligence, trust signals, and real-time demand insights.";

export function getHeroHeadline(
  city: string | undefined,
  demandLevel: TrustSignals["demandLevel"] | undefined,
  defaultHeadline: string = DEFAULT_HEADLINE
): string {
  if (!city?.trim()) return defaultHeadline;
  const c = city.trim();
  if (demandLevel === "unknown" || demandLevel == null) {
    return `Explore trending homes in ${c}`;
  }
  if (demandLevel === "high") {
    return `Discover high-demand listings in ${c}`;
  }
  if (demandLevel === "medium") {
    return `Explore trending homes in ${c}`;
  }
  return `Find great opportunities in ${c}`;
}

export function getHeroSubcopy(
  behavior: UserBehaviorType | undefined,
  defaultSubcopy: string = DEFAULT_SUBCOPY
): string {
  if (behavior === "high_intent") {
    return "Listings are filling fast — act now";
  }
  if (behavior === "browser") {
    return "Discover listings tailored to your preferences";
  }
  return defaultSubcopy;
}

export type CtaEmphasis = "explore" | "list";

/**
 * @param ctaOverride — future: highlight "List Property" for seller segment
 */
export function getPrimaryCtaEmphasis(
  behavior: UserBehaviorType | undefined,
  ctaOverride?: CtaEmphasis
): CtaEmphasis {
  if (ctaOverride) return ctaOverride;
  if (behavior === "high_intent") return "explore";
  return "explore";
}

/**
 * Appends `?city=` (or &city=) for search prefill when a preferred city exists.
 */
export function buildExploreHrefWithCityPrefill(base: string, preferredCity: string | undefined): string {
  if (!base || !preferredCity?.trim()) return base;
  const c = preferredCity.trim();
  const hashIdx = base.indexOf("#");
  const pathAndQuery = hashIdx === -1 ? base : base.slice(0, hashIdx);
  const hash = hashIdx === -1 ? "" : base.slice(hashIdx);
  const [path, queryString = ""] = pathAndQuery.split("?", 2);
  const params = new URLSearchParams(queryString);
  if (!params.has("city")) {
    params.set("city", c);
  }
  const qs = params.toString();
  return `${path}${qs ? `?${qs}` : ""}${hash}`;
}

export function formatHeroTrustStrip(signals: Pick<TrustSignals, "listingCount" | "viewsToday">): string[] {
  const lines: string[] = [];
  if (signals.listingCount > 0) {
    lines.push(`${signals.listingCount.toLocaleString()}+ listings available`);
  }
  if (signals.viewsToday > 0) {
    lines.push(`${signals.viewsToday.toLocaleString()}+ users browsing today`);
  }
  return lines;
}

export { DEFAULT_HEADLINE, DEFAULT_SUBCOPY };

/**
 * `…/listings` → `…/bnhub/listings` (preserves query string after the segment).
 * Used to deep-link a BNHub stay from marketing hero.
 */
export function defaultListingDetailBaseFromListingsHref(listingsHref: string): string {
  const sub = "/listings";
  const i = listingsHref.indexOf(sub);
  if (i < 0) {
    return `${listingsHref.replace(/\/$/, "")}/bnhub/listings`;
  }
  return `${listingsHref.slice(0, i)}/bnhub/listings${listingsHref.slice(i + sub.length)}`;
}
