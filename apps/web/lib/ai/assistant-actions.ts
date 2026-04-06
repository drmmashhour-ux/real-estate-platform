import {
  DEFAULT_GLOBAL_FILTERS,
  globalFiltersToUrlParams,
  type GlobalSearchFiltersExtended,
} from "@/components/search/FilterState";
import type { ParsedSearchIntent } from "@/lib/ai/parseSearchIntent";
import { stayFiltersFromIntent } from "@/lib/ai/parseSearchIntent";
import type { ParsedVoiceQuery } from "@/lib/search/parseVoiceQuery";

type Segment = "" | "residential" | "for-rent" | "commercial";

function filtersFromInputs(
  location: string,
  priceMinRaw: string,
  priceMaxRaw: string,
  segment: Segment,
  bedroomsRaw: string
): GlobalSearchFiltersExtended {
  const priceMin = Math.max(0, Number.parseInt(priceMinRaw, 10) || 0);
  const priceMax = Math.max(0, Number.parseInt(priceMaxRaw, 10) || 0);
  const bedN = Number.parseInt(bedroomsRaw, 10);
  const bedrooms = bedroomsRaw !== "" && Number.isFinite(bedN) && bedN >= 0 ? bedN : null;

  const base: GlobalSearchFiltersExtended = {
    ...DEFAULT_GLOBAL_FILTERS,
    location: location.trim(),
    priceMin,
    priceMax,
    bedrooms,
  };

  switch (segment) {
    case "residential":
      return { ...base, type: "residential" };
    case "for-rent":
      return { ...base, type: "rent", rentListingCategory: "residential" };
    case "commercial":
      return { ...base, type: "commercial" };
    default:
      return { ...base, type: "buy" };
  }
}

function mergePropertyTypes(f: GlobalSearchFiltersExtended, p: ParsedVoiceQuery): GlobalSearchFiltersExtended {
  if (p.segment === "commercial") {
    return { ...f, propertyTypes: [], propertyType: "COMMERCIAL" };
  }
  if (p.propertyTypes?.length) {
    return { ...f, propertyTypes: [...p.propertyTypes], propertyType: "" };
  }
  return f;
}

/** Build `/search?...` from parsed property/rent/commercial intent. */
export function buildPropertySearchHref(parsed: ParsedSearchIntent): string {
  const p = parsed.property;
  if (!p) {
    const qs = globalFiltersToUrlParams({ ...DEFAULT_GLOBAL_FILTERS }).toString();
    return qs ? `/search?${qs}` : "/search";
  }

  const location = p.city ?? "";
  const minPrice = p.minPrice != null && p.minPrice > 0 ? String(p.minPrice) : "";
  const maxPrice =
    p.maxPrice != null && p.maxPrice > 0
      ? String(p.maxPrice)
      : parsed.monthlyRentMax != null
        ? String(parsed.monthlyRentMax)
        : "";
  const bedrooms = p.beds != null ? String(p.beds) : "";

  let segment: Segment = "";
  if (parsed.category === "commercial" || p.segment === "commercial") segment = "commercial";
  else if (parsed.category === "rent" || p.segment === "for-rent") segment = "for-rent";
  else if (p.segment === "residential") segment = "residential";
  else segment = "";

  let f = filtersFromInputs(location, minPrice, maxPrice, segment, bedrooms);
  f = mergePropertyTypes(f, p);
  if (parsed.featureSlugs.length) {
    f = { ...f, features: [...new Set([...f.features, ...parsed.featureSlugs])] };
  }
  const qs = globalFiltersToUrlParams(f).toString();
  return qs ? `/search?${qs}` : "/search";
}

/** Build `/bnhub/stays?...` for short-term discovery (synced by `BnhubStaysQuerySync`). */
export function buildStaySearchHref(parsed: ParsedSearchIntent): string {
  const f = stayFiltersFromIntent(parsed);
  const p = new URLSearchParams();
  if (f.location.trim()) p.set("city", f.location.trim());
  if (f.guests != null && f.guests > 0) p.set("guests", String(f.guests));
  if (f.checkIn?.trim()) p.set("checkIn", f.checkIn.trim());
  if (f.checkOut?.trim()) p.set("checkOut", f.checkOut.trim());
  if (f.priceMax > 0) p.set("maxPrice", String(Math.round(f.priceMax)));
  if (f.bedrooms != null && f.bedrooms >= 0) p.set("minBeds", String(f.bedrooms));
  const qs = p.toString();
  return qs ? `/bnhub/stays?${qs}` : "/bnhub/stays";
}

export function confirmationLineForProperty(parsed: ParsedSearchIntent): string {
  const p = parsed.property;
  const parts: string[] = [];
  if (p?.propertyTypes?.includes("CONDO")) parts.push("condos");
  else if (parsed.category === "commercial") parts.push("commercial listings");
  else if (parsed.category === "rent") parts.push("rentals");
  else parts.push("properties");
  if (p?.city) parts.push(`in ${p.city}`);
  if (p?.maxPrice) parts.push(`under $${Math.round(p.maxPrice / 1000)}k`);
  else if (parsed.monthlyRentMax) parts.push(`under $${parsed.monthlyRentMax}/month`);
  if (p?.beds) parts.push(`${p.beds}+ bedrooms`);
  return parts.length > 1 ? `Showing ${parts.join(" ")}.` : "Opening search with your filters.";
}

export function confirmationLineForStay(parsed: ParsedSearchIntent): string {
  const c = parsed.stayCity ?? parsed.property?.city;
  const g = parsed.guests;
  let line = "Opening short stays";
  if (c) line += ` in ${c}`;
  if (g) line += ` for ${g} guests`;
  if (parsed.checkIn && parsed.checkOut) line += ` (${parsed.checkIn} → ${parsed.checkOut})`;
  line += ".";
  return line;
}
