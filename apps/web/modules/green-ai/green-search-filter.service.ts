import { logGreenEvent } from "./green-search-helpers";
import type { GreenSearchFilters, GreenSearchResultDecoration } from "./green-search.types";

const LABEL_RANK: Record<"GREEN" | "IMPROVABLE" | "LOW", number> = {
  GREEN: 2,
  IMPROVABLE: 1,
  LOW: 0,
};

function labelMeetsMinimum(
  label: "GREEN" | "IMPROVABLE" | "LOW" | null,
  min: "GREEN" | "IMPROVABLE" | "LOW"
): boolean {
  if (label == null) return false;
  return LABEL_RANK[label] >= LABEL_RANK[min];
}

function hasUpgradeSemantics(d: GreenSearchResultDecoration | null | undefined): boolean | null {
  if (!d) return null;
  if (d.improvementPotential === "high" || d.improvementPotential === "medium") return true;
  if (typeof d.scoreDelta === "number" && d.scoreDelta >= 10) return true;
  return false;
}

function matchesPropertyToggles(
  d: GreenSearchResultDecoration | null | undefined,
  f: GreenSearchFilters
): boolean {
  const need = (cond: boolean | undefined, val: boolean | null | undefined) => {
    if (!cond) return true;
    if (val === true) return true;
    return false;
  };
  if (!d) {
    if (
      f.showOnlyEfficientHeating ||
      f.showOnlyHighInsulation ||
      f.showOnlyHighWindowPerformance ||
      f.showSolarOnly ||
      f.showGreenRoofOnly
    ) {
      return false;
    }
    return true;
  }
  if (!need(f.showOnlyEfficientHeating, d.efficientHeating)) return false;
  if (!need(f.showOnlyHighInsulation, d.highInsulation)) return false;
  if (!need(f.showOnlyHighWindowPerformance, d.highWindowPerformance)) return false;
  if (!need(f.showSolarOnly, d.hasSolar)) return false;
  if (!need(f.showGreenRoofOnly, d.hasGreenRoof)) return false;
  return true;
}

/**
 * Deterministic filter — does not mutate `items` or `decorationById`.
 * If a required signal is missing, the row **does not** match the filter (strict for green-only discovery).
 */
export function applyGreenSearchFilters<T extends { id: string }>(
  items: readonly T[],
  filters: GreenSearchFilters | undefined,
  decorationById: ReadonlyMap<string, GreenSearchResultDecoration | null>
): T[] {
  if (filters == null) return [...items];
  const active = Object.values(filters).some((v) => v !== undefined && v !== null);
  if (!active) return [...items];

  const out: T[] = [];
  for (const item of items) {
    const d = decorationById.get(item.id) ?? null;
    if (typeof filters.minimumQuebecScore === "number") {
      const sc = d?.currentScore;
      if (sc == null || sc < filters.minimumQuebecScore) continue;
    }
    if (filters.minimumGreenLabel) {
      if (!labelMeetsMinimum(d?.label ?? null, filters.minimumGreenLabel)) continue;
    }
    if (filters.hasUpgradePotential === true) {
      const u = hasUpgradeSemantics(d);
      if (u !== true) continue;
    }
    if (typeof filters.minimumProjectedScore === "number") {
      const p = d?.projectedScore;
      if (p == null || p < filters.minimumProjectedScore) continue;
    }
    if (typeof filters.minimumScoreDelta === "number") {
      const s = d?.scoreDelta;
      if (s == null || s < filters.minimumScoreDelta) continue;
    }
    if (filters.hasPotentialIncentives === true) {
      if (d?.hasPotentialIncentives !== true) continue;
    }
    if (typeof filters.minimumEstimatedIncentives === "number") {
      const n = d?.estimatedIncentives;
      if (n == null || n < filters.minimumEstimatedIncentives) continue;
    }
    if (!matchesPropertyToggles(d, filters)) continue;
    out.push(item);
  }

  logGreenEvent("green_search_filters_applied", {
    before: items.length,
    after: out.length,
  });
  return out;
}

export function isGreenFiltersActive(f: GreenSearchFilters | undefined): boolean {
  if (!f) return false;
  return (Object.values(f) as unknown[]).some(
    (v) => v !== undefined && v !== null && (typeof v !== "boolean" || v === true)
  );
}
