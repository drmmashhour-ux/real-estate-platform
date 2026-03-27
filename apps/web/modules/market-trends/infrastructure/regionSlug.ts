/** Normalize city/region labels for snapshot keys (must match refresh aggregation). */
export function slugRegionCity(city: string): string {
  return city
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 96);
}
