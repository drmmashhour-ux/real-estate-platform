/** Earth-radius helpers for Syria bbox filter + optional distance sort (km). */

export function boundingBoxKm(centerLat: number, centerLng: number, radiusKm: number) {
  const latDelta = radiusKm / 111;
  const cosLat = Math.cos((centerLat * Math.PI) / 180);
  const lngDelta = radiusKm / (111 * Math.max(Math.abs(cosLat), 0.05));
  return {
    minLat: centerLat - latDelta,
    maxLat: centerLat + latDelta,
    minLng: centerLng - lngDelta,
    maxLng: centerLng + lngDelta,
  };
}

export function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(x)));
}

/** Deterministic jitter (~±150m) so public maps never pinpoint the exact stored coordinate. */
export function fuzzLatLngForDisplay(seed: string, lat: number, lng: number): { lat: number; lng: number } {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  const r1 = ((h % 401) - 200) / 133200;
  const r2 = ((((h / 7) | 0) % 401) - 200) / (133200 * Math.max(Math.cos((lat * Math.PI) / 180), 0.2));
  return { lat: lat + r1, lng: lng + r2 };
}
