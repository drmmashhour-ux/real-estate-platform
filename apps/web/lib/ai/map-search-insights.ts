import "server-only";

export type MapInsightStats = {
  count: number;
  medianPrice: number;
  minPrice: number;
  maxPrice: number;
  soldCount: number;
  pendingCount: number;
  activeCount: number;
};

export function buildRuleBasedMapInsight(stats: MapInsightStats, dealKind: "rent" | "sale", city?: string): string {
  void city;
  const focus = dealKind === "rent" ? "leasing" : "buying";
  return (
    `${focus.charAt(0).toUpperCase() + focus.slice(1)} snapshot: median price near ${Math.round(stats.medianPrice)}, ` +
    `range ${Math.round(stats.minPrice)}–${Math.round(stats.maxPrice)}, ` +
    `${stats.count} listings (${stats.activeCount} active, ${stats.soldCount} sold, ${stats.pendingCount} pending). ` +
    "Stub insight — tighten copy when production signals are wired."
  );
}
