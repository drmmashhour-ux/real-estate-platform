/**
 * Senior Living Hub — area “best fit” heatmap from current result set (client-side).
 *
 * areaScore ≈ residence_count × average_match_score × conversion_rate
 * (conversion is a gentle default until funnel metrics are wired per area.)
 */

export type HeatmapPointFeature = {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] };
  properties?: { weight?: number; areaScore?: number };
};

export type HeatmapGeoJSON = {
  type: "FeatureCollection";
  features: HeatmapPointFeature[];
};

export type ResidenceHeatInput = {
  id: string;
  latitude: number;
  longitude: number;
  /** 0–100 from matching API; browse mode uses neutral default. */
  matchScore: number | null | undefined;
};

export type BuildHeatmapOptions = {
  /** Typical inquiry→visit conversion for weighting (0–1). Default tuned low so spread stays visible. */
  defaultConversionRate?: number;
};

const DEFAULT_MATCH_NEUTRAL = 72;
const DEFAULT_CONVERSION = 0.065;
/** ~2 km grid at mid-latitudes — keeps zones readable for seniors. */
const CELL_STEP = 0.018;

type CellAgg = {
  latSum: number;
  lngSum: number;
  count: number;
  matchSum: number;
};

function cellKey(lat: number, lng: number): string {
  const q = (v: number) => Math.round(v / CELL_STEP);
  return `${q(lat)}_${q(lng)}`;
}

/**
 * Aggregate residences into grid cells; compute normalized heat `weight` (0–1) for Mapbox heatmap layer.
 */
export function buildHeatmapGeoJSON(
  residences: ResidenceHeatInput[],
  options?: BuildHeatmapOptions,
): HeatmapGeoJSON {
  const conversion = options?.defaultConversionRate ?? DEFAULT_CONVERSION;
  const cells = new Map<string, CellAgg>();

  for (const r of residences) {
    if (!Number.isFinite(r.latitude) || !Number.isFinite(r.longitude)) continue;
    const key = cellKey(r.latitude, r.longitude);
    const m = cells.get(key) ?? { latSum: 0, lngSum: 0, count: 0, matchSum: 0 };
    const score = typeof r.matchScore === "number" && Number.isFinite(r.matchScore) ? r.matchScore : DEFAULT_MATCH_NEUTRAL;
    m.latSum += r.latitude;
    m.lngSum += r.longitude;
    m.count += 1;
    m.matchSum += score;
    cells.set(key, m);
  }

  const rawScores: number[] = [];
  const entries: { areaScore: number; lng: number; lat: number }[] = [];

  for (const [, agg] of cells) {
    const lng = agg.lngSum / Math.max(1, agg.count);
    const lat = agg.latSum / Math.max(1, agg.count);
    const avgMatch = agg.matchSum / Math.max(1, agg.count);
    const areaScore = agg.count * avgMatch * conversion;
    rawScores.push(areaScore);
    entries.push({ areaScore, lng, lat });
  }

  const maxRaw = rawScores.length ? Math.max(...rawScores) : 1;

  const features: HeatmapPointFeature[] = entries.map((e) => {
    const weight = maxRaw > 0 ? Math.min(1, e.areaScore / maxRaw) : 0;
    return {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [e.lng, e.lat],
      },
      properties: {
        weight,
        areaScore: e.areaScore,
      },
    };
  });

  return {
    type: "FeatureCollection",
    features,
  };
}

/** Fly map to the strongest heat cell (after heatmap is enabled). */
export function getBestZoneLngLat(geojson: HeatmapGeoJSON): [number, number] | null {
  let best: [number, number] | null = null;
  let bestW = -1;
  for (const f of geojson.features) {
    if (f.geometry?.type !== "Point") continue;
    const w = typeof f.properties?.weight === "number" ? f.properties.weight : 0;
    if (w > bestW) {
      bestW = w;
      const c = f.geometry.coordinates;
      best = [c[0], c[1]];
    }
  }
  return best;
}
