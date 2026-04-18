import {
  SYRIA_LOCATIONS,
  allSyriaCitiesFlat,
  findSyriaCityByStored,
} from "@/data/syriaLocations";

const MAX_CUSTOM_AREA_LEN = 200;

/** English `name_en` of every city in the tree (for allow-lists). */
export const CANONICAL_SYRIA_CITY_EN = new Set(allSyriaCitiesFlat().map((c) => c.name_en));

/** Resolve URL / form input to canonical English city key. */
export function normalizeCitySearchParam(raw: string): string | null {
  const hit = findSyriaCityByStored(raw.trim());
  return hit?.city.name_en ?? null;
}

/** Resolve governorate filter input to canonical English governorate key. */
export function normalizeGovernorateSearchParam(raw: string): string | null {
  const q = raw.trim();
  if (!q) return null;
  const g = SYRIA_LOCATIONS.find((row) => row.name_en === q || row.name_ar === q);
  return g?.name_en ?? null;
}

export function cityCanonicalNamesForGovernorateFilter(governorateEn: string): string[] {
  const g = SYRIA_LOCATIONS.find((row) => row.name_en === governorateEn);
  return g ? g.cities.map((c) => c.name_en) : [];
}

/**
 * Normalize area for DB: catalog entries → Arabic `name_ar`; custom text trimmed & capped.
 */
export function normalizeAreaForStorage(cityCanonicalEn: string, areaRaw: string): string | null {
  const trimmed = areaRaw.trim();
  if (!trimmed) return null;
  const hit = findSyriaCityByStored(cityCanonicalEn);
  if (!hit) return trimmed.slice(0, MAX_CUSTOM_AREA_LEN);
  for (const a of hit.city.areas) {
    if (a.name_ar === trimmed || a.name_en.toLowerCase() === trimmed.toLowerCase()) {
      return a.name_ar;
    }
  }
  return trimmed.slice(0, MAX_CUSTOM_AREA_LEN);
}

export type ListingLocationValidation =
  | { ok: true; cityEn: string; area: string | null }
  | { ok: false };

/** Strict listing validation: city must exist in catalog; area optional, normalized. */
export function validateListingLocation(cityRaw: string, areaRaw: string | null): ListingLocationValidation {
  const cityEn = normalizeCitySearchParam(cityRaw);
  if (!cityEn) return { ok: false };
  const areaTrimmed = (areaRaw ?? "").trim();
  if (!areaTrimmed) return { ok: true, cityEn, area: null };
  const area = normalizeAreaForStorage(cityEn, areaTrimmed);
  if (!area || area.length === 0) return { ok: true, cityEn, area: null };
  return { ok: true, cityEn, area };
}

const MAX_PLACE_NAME = 240;

export type ListingLocationFormValidation =
  | { ok: true; governorateEn: string; cityEn: string; area: string | null; placeName: string | null }
  | { ok: false };

/**
 * Validates governorate + city coherence (city must belong to selected governorate).
 * Primary truth remains coordinates on the server action (required separately).
 */
export function validateListingGovernorateCityArea(
  governorateRaw: string,
  cityRaw: string,
  areaRaw: string | null,
  placeNameRaw: string | null,
): ListingLocationFormValidation {
  const govEn = normalizeGovernorateSearchParam(governorateRaw);
  const cityHit = findSyriaCityByStored(cityRaw);
  if (!govEn || !cityHit) return { ok: false };
  if (cityHit.governorate.name_en !== govEn) return { ok: false };

  const inner = validateListingLocation(cityRaw, areaRaw);
  if (!inner.ok) return { ok: false };

  const pn = (placeNameRaw ?? "").trim();
  const placeName = pn ? pn.slice(0, MAX_PLACE_NAME) : null;

  return { ok: true, governorateEn: govEn, cityEn: inner.cityEn, area: inner.area, placeName };
}
