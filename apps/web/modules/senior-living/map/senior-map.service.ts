import { careLevelShortLabel } from "@/modules/senior-living/friendly-copy";
import type { LngLatBoundsLike, SeniorMapPin } from "./senior-map.types";
import { SENIOR_MAP_DEFAULT_MAX_PINS, SENIOR_MAP_NEARBY_MAX_PINS } from "./senior-map.types";

/** Central Canada fallback when nothing is geocoded yet (neutral, zoomed-out). */
export const DEFAULT_MAP_CENTER = { longitude: -79.38, latitude: 43.65, zoom: 9 };

/** Rough city centers for framing when URL has `city=` but pins lack coordinates yet. */
export function cityCenterFromName(city: string | null | undefined): {
  longitude: number;
  latitude: number;
  zoom: number;
} | null {
  if (!city?.trim()) return null;
  const raw = city.trim().toLowerCase();
  const normalized = raw.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const MAP: Record<string, { longitude: number; latitude: number; zoom: number }> = {
    toronto: { longitude: -79.3832, latitude: 43.6532, zoom: 11 },
    montreal: { longitude: -73.5673, latitude: 45.5017, zoom: 11 },
    montréal: { longitude: -73.5673, latitude: 45.5017, zoom: 11 },
    ottawa: { longitude: -75.6972, latitude: 45.4215, zoom: 11 },
    calgary: { longitude: -114.0719, latitude: 51.0447, zoom: 11 },
    vancouver: { longitude: -123.1216, latitude: 49.2827, zoom: 11 },
    edmonton: { longitude: -113.4909, latitude: 53.5461, zoom: 11 },
    winnipeg: { longitude: -97.1384, latitude: 49.8951, zoom: 11 },
    quebec: { longitude: -71.2074, latitude: 46.8139, zoom: 11 },
    halifax: { longitude: -63.5753, latitude: 44.6488, zoom: 11 },
    hamilton: { longitude: -79.8711, latitude: 43.2557, zoom: 11 },
    london: { longitude: -81.2453, latitude: 42.9849, zoom: 11 },
  };
  const slug = normalized.replace(/\s+/g, " ");
  for (const [key, v] of Object.entries(MAP)) {
    if (slug.includes(key)) return v;
  }
  const firstWord = slug.split(/[\s,]+/)[0];
  if (firstWord && MAP[firstWord]) return MAP[firstWord];
  return null;
}

export function maxPinsForMode(nearbyMode: boolean): number {
  return nearbyMode ? SENIOR_MAP_NEARBY_MAX_PINS : SENIOR_MAP_DEFAULT_MAX_PINS;
}

/** Take the first N pins from ordered results (already sorted by match/list). */
export function capPins(pins: SeniorMapPin[], nearbyMode: boolean): SeniorMapPin[] {
  const max = maxPinsForMode(nearbyMode);
  return pins.slice(0, max);
}

export function pinInBounds(pin: SeniorMapPin, b: LngLatBoundsLike): boolean {
  const { longitude: lng, latitude: lat } = pin;
  return lng >= b.west && lng <= b.east && lat >= b.south && lat <= b.north;
}

/** Render only markers inside the current viewport (perf / clarity when zoomed in). */
export function filterPinsVisibleInBounds(pins: SeniorMapPin[], bounds: LngLatBoundsLike | null): SeniorMapPin[] {
  if (!bounds) return pins;
  return pins.filter((p) => pinInBounds(p, bounds));
}

function pinInnerLabel(r: {
  basePrice: number | null;
  priceRangeMin: number | null;
  priceRangeMax: number | null;
}): { label: string; showsPrice: boolean } {
  if (r.basePrice != null && Number.isFinite(r.basePrice)) {
    return { label: `$${Math.round(r.basePrice)}`, showsPrice: true };
  }
  if (
    r.priceRangeMin != null &&
    r.priceRangeMax != null &&
    Number.isFinite(r.priceRangeMin) &&
    Number.isFinite(r.priceRangeMax)
  ) {
    const mid = (r.priceRangeMin + r.priceRangeMax) / 2;
    return { label: `$${Math.round(mid)}`, showsPrice: true };
  }
  return { label: "", showsPrice: false };
}

export function buildSeniorMapPins(
  rows: {
    id: string;
    name: string;
    careLevel: string;
    latitude: number | null;
    longitude: number | null;
    basePrice: number | null;
    priceRangeMin: number | null;
    priceRangeMax: number | null;
  }[],
  priceLabelFor: (r: (typeof rows)[number]) => string,
  detailHref: (id: string) => string,
): SeniorMapPin[] {
  const out: SeniorMapPin[] = [];
  for (const r of rows) {
    if (r.latitude == null || r.longitude == null) continue;
    const lat = r.latitude;
    const lng = r.longitude;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    const inner = pinInnerLabel(r);
    out.push({
      id: r.id,
      name: r.name,
      latitude: lat,
      longitude: lng,
      priceLabel: priceLabelFor(r),
      careLevelLabel: careLevelShortLabel(r.careLevel),
      detailHref: detailHref(r.id),
      pinLabel: inner.label,
      pinShowsPrice: inner.showsPrice,
    });
  }
  return out;
}

export function boundsFromPins(pins: SeniorMapPin[]): [[number, number], [number, number]] | null {
  if (pins.length === 0) return null;
  let west = pins[0]!.longitude;
  let east = pins[0]!.longitude;
  let south = pins[0]!.latitude;
  let north = pins[0]!.latitude;
  for (const p of pins) {
    west = Math.min(west, p.longitude);
    east = Math.max(east, p.longitude);
    south = Math.min(south, p.latitude);
    north = Math.max(north, p.latitude);
  }
  if (west === east && south === north) {
    const pad = 0.02;
    return [
      [west - pad, south - pad],
      [east + pad, north + pad],
    ];
  }
  return [
    [west, south],
    [east, north],
  ];
}
