/** Static markets for structured search (expand later or sync from API). */
export const LOCATION_MARKETS: Record<string, string[]> = {
  Canada: ["Montreal", "Toronto", "Laval"],
  USA: ["Miami", "New York", "Los Angeles"],
};

export const COUNTRY_OPTIONS = Object.keys(LOCATION_MARKETS) as string[];

export function citiesForCountry(country: string | null): string[] {
  if (!country) return [];
  return LOCATION_MARKETS[country] ?? [];
}
