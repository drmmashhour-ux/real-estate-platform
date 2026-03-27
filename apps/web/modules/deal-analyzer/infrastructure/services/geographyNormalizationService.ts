import { RegionalProfileKey, type RegionalProfileId } from "@/modules/deal-analyzer/domain/regionalPricing";

const DENSE_CITIES = new Set(
  [
    "montreal",
    "montréal",
    "toronto",
    "vancouver",
    "calgary",
    "ottawa",
    "edmonton",
    "quebec",
    "québec",
    "winnipeg",
    "hamilton",
  ].map((c) => c.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()),
);

/** Heuristic province/region label — not government-verified. */
export function inferRegionLabel(city: string | null | undefined): string {
  const c = (city ?? "").trim().toLowerCase();
  if (!c) return "unknown";
  if (/montréal|montreal|québec|quebec|laval|gatineau/.test(c)) return "QC";
  if (/toronto|ottawa|mississauga|hamilton|london|kitchener/.test(c)) return "ON";
  if (/vancouver|victoria|surrey|burnaby/.test(c)) return "BC";
  return "generic";
}

export function classifyMarketDensity(city: string | null | undefined, activeCityListingCount: number): RegionalProfileId {
  const c = (city ?? "").trim().toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
  if (DENSE_CITIES.has(c) || activeCityListingCount >= 80) return RegionalProfileKey.DENSE_URBAN;
  if (activeCityListingCount >= 25) return RegionalProfileKey.SUBURBAN;
  if (activeCityListingCount < 12) return RegionalProfileKey.SPARSE;
  return RegionalProfileKey.GENERIC;
}
