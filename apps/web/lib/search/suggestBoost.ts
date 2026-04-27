export type SuggestListingRow = {
  id: string;
  title: string;
  city: string;
  price: number;
};

const MAX_RETURN = 5;

function inPreferredList(city: string | null | undefined, preferred: string[]): number {
  if (!city || preferred.length === 0) return 1;
  const c = city.trim().toLowerCase();
  return preferred.some((p) => p.trim().toLowerCase() === c) ? 0 : 1;
}

/**
 * Reorders listings so `preferredCities` (case-insensitive) come first, then by original order.
 */
export function boostListingsByPreferredCities(
  rows: SuggestListingRow[],
  preferredCities: string[]
): SuggestListingRow[] {
  if (preferredCities.length === 0) return rows.slice(0, MAX_RETURN);
  return [...rows]
    .sort((a, b) => inPreferredList(a.city, preferredCities) - inPreferredList(b.city, preferredCities))
    .slice(0, MAX_RETURN);
}

export function sortCitiesByPreferred(cities: string[], preferredCities: string[], max: number) {
  const cityPref = (a: string, b: string) =>
    inPreferredList(a, preferredCities) - inPreferredList(b, preferredCities) ||
    a.localeCompare(b, undefined, { sensitivity: "base" });
  return [...cities].sort(cityPref).slice(0, max);
}
