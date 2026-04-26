/**
 * Bridges legacy single-field rows to bilingual shapes for UI — deterministic, no throws.
 */

import { findSyriaCityByStored } from "@/data/syriaLocations";
import type { SyriaProperty } from "@/generated/prisma";

export type LegacyPropertyCompat = Pick<
  SyriaProperty,
  "city" | "cityAr" | "cityEn" | "area" | "districtAr" | "districtEn"
>;

function districtEnFromArea(cityCanonicalEn: string, areaStored: string | null | undefined): string | null {
  try {
    const ar = typeof areaStored === "string" ? areaStored.trim() : "";
    if (!ar) return null;
    const hit = findSyriaCityByStored(cityCanonicalEn);
    if (!hit) return null;
    for (const a of hit.city.areas) {
      if (a.name_ar === ar || a.name_en.toLowerCase() === ar.toLowerCase()) return a.name_en;
    }
    return null;
  } catch {
    return null;
  }
}

/** Normalize nullable bilingual fields when reading older rows (fill from catalog when possible). */
export function normalizeLegacyPropertyFields(property: LegacyPropertyCompat): LegacyPropertyCompat {
  try {
    const cityEn = property.cityEn?.trim() || property.city?.trim() || "";
    const hit = cityEn ? findSyriaCityByStored(cityEn) : undefined;
    const cityAr = property.cityAr?.trim() || hit?.city.name_ar || null;
    const districtAr = property.districtAr?.trim() || property.area?.trim() || null;
    const districtEn =
      property.districtEn?.trim() || districtEnFromArea(property.city, property.area) || null;
    return {
      ...property,
      cityEn: cityEn || property.city,
      cityAr: cityAr ?? property.cityAr ?? null,
      districtAr: districtAr ?? property.districtAr ?? null,
      districtEn: districtEn ?? property.districtEn ?? null,
    };
  } catch {
    return property;
  }
}

/** Shape used by cards/list pages — spreads normalized bilingual hints without mutating DB. */
export function backfillLocalizedPropertyShape(property: LegacyPropertyCompat): LegacyPropertyCompat {
  return normalizeLegacyPropertyFields(property);
}
