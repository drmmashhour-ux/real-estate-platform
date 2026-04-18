import type { GeoKey, GeoPerformance } from "./v4-types";
import { V4_MAX_GEO_BUDGET_SHARE, V4_SINGLE_GEO_EXPLORATION_RESERVE, isTrustedVolume } from "./v4-safety";

export type GeoBudgetSplitRow = {
  geo: GeoKey;
  budget: number;
  trusted: boolean;
  note?: string;
};

const EXPLORATION_GEO: GeoKey = {
  country: "—",
  region: "exploration",
  city: "reserved",
};

/** Normalize positive weights to sum 1, then cap each at `maxShare` and redistribute deficit by headroom. */
function cappedShares(weights: number[], maxShare: number): number[] {
  const n = weights.length;
  if (n === 0) return [];
  let s = weights.map((x) => (x > 0 ? x : 1e-9));
  const sumW = s.reduce((a, b) => a + b, 0);
  s = s.map((x) => x / sumW);

  for (let iter = 0; iter < n + 5; iter++) {
    s = s.map((x) => Math.min(x, maxShare));
    const t = s.reduce((a, b) => a + b, 0);
    if (t >= 1 - 1e-9) {
      return s.map((x) => x / t);
    }
    const deficit = 1 - t;
    const headroom = s.map((x) => Math.max(0, maxShare - x));
    const hr = headroom.reduce((a, b) => a + b, 0);
    if (hr < 1e-12) {
      return s.map((x) => x / (t || 1));
    }
    s = s.map((x, i) => x + (deficit * headroom[i]!) / hr);
  }

  const f = s.reduce((a, b) => a + b, 0);
  return s.map((x) => x / f);
}

/**
 * Distributes total budget by ROAS share, caps each geo (never 100% to one bucket when multiple geos),
 * and reserves a slice when a single geo would absorb everything.
 */
export function splitBudgetByGeo(totalBudget: number, geoData: GeoPerformance[]): GeoBudgetSplitRow[] {
  if (totalBudget <= 0 || geoData.length === 0) {
    return [];
  }

  const trustedRows = geoData.filter((g) => isTrustedVolume(g.clicks, g.impressions));
  const use = trustedRows.length > 0 ? trustedRows : geoData;

  if (use.length === 1) {
    const g = use[0]!;
    const mainShare = 1 - V4_SINGLE_GEO_EXPLORATION_RESERVE;
    return [
      {
        geo: g.geo,
        budget: Math.round(totalBudget * mainShare * 100) / 100,
        trusted: isTrustedVolume(g.clicks, g.impressions),
        note: "Single geo: main share capped; remainder reserved for exploration.",
      },
      {
        geo: EXPLORATION_GEO,
        budget: Math.round(totalBudget * V4_SINGLE_GEO_EXPLORATION_RESERVE * 100) / 100,
        trusted: true,
        note: "Not allocated to a single geography (safety reserve).",
      },
    ];
  }

  const weights = use.map((g) => Math.max(g.roas, 0));
  const shares = cappedShares(weights, V4_MAX_GEO_BUDGET_SHARE);

  return use.map((g, i) => ({
    geo: g.geo,
    budget: Math.round(totalBudget * (shares[i] ?? 0) * 100) / 100,
    trusted: isTrustedVolume(g.clicks, g.impressions),
  }));
}
