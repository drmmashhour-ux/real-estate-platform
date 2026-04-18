import { SYRIA_GOVERNORATES, findSyriaCityByStored, type SyriaCity } from "@/data/syriaLocations";

export function resolveCityLabel(cityStored: string, locale: string): string {
  const hit = findSyriaCityByStored(cityStored);
  if (!hit) return cityStored;
  return locale.startsWith("ar") ? hit.city.name_ar : hit.city.name_en;
}

/** Canonical governorate `name_en` stored on listing → display label. */
export function resolveGovernorateLabel(governorateStored: string | null | undefined, locale: string): string | null {
  const q = governorateStored?.trim();
  if (!q) return null;
  const row = SYRIA_GOVERNORATES.find((g) => g.name_en === q || g.name_ar === q);
  if (!row) return q;
  return locale.startsWith("ar") ? row.name_ar : row.name_en;
}

/** Resolved city row for filters/UI, or undefined if legacy/unknown slug. */
export function cityRowByStored(cityStored: string): SyriaCity | undefined {
  return findSyriaCityByStored(cityStored)?.city;
}
