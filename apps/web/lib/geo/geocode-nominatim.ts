/**
 * Forward geocoding via Nominatim (OSM). Use sparingly; respect usage policy / rate limits.
 */

export type GeocodeResult = { latitude: number; longitude: number } | null;

export type GeocodeBoundingBox = { south: number; north: number; west: number; east: number };

export type GeocodeDetailedResult = {
  latitude: number;
  longitude: number;
  boundingBox: GeocodeBoundingBox | null;
};

type NominatimHit = {
  lat?: string;
  lon?: string;
  boundingbox?: string[];
  display_name?: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
  };
};

function parseHit(first: NominatimHit): GeocodeDetailedResult | null {
  if (!first?.lat || !first?.lon) return null;
  const latitude = Number.parseFloat(first.lat);
  const longitude = Number.parseFloat(first.lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  let boundingBox: GeocodeBoundingBox | null = null;
  const bb = first.boundingbox;
  if (Array.isArray(bb) && bb.length >= 4) {
    const south = Number.parseFloat(bb[0]!);
    const north = Number.parseFloat(bb[1]!);
    const west = Number.parseFloat(bb[2]!);
    const east = Number.parseFloat(bb[3]!);
    if (
      Number.isFinite(south) &&
      Number.isFinite(north) &&
      Number.isFinite(west) &&
      Number.isFinite(east) &&
      north > south &&
      east > west
    ) {
      boundingBox = { south, north, west, east };
    }
  }

  return { latitude, longitude, boundingBox };
}

export async function geocodeLocationDetailed(query: string): Promise<GeocodeDetailedResult | null> {
  const q = query.trim();
  if (q.length < 4) return null;
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=0&q=${encodeURIComponent(q)}`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "LECIPM-RealEstatePlatform/1.0 (contact@example.com)",
        Accept: "application/json",
      },
      next: { revalidate: 0 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as NominatimHit[];
    const first = data[0];
    if (!first) return null;
    return parseHit(first);
  } catch {
    return null;
  }
}

export async function geocodeAddressLine(query: string): Promise<GeocodeResult> {
  const detailed = await geocodeLocationDetailed(query);
  if (!detailed) return null;
  return { latitude: detailed.latitude, longitude: detailed.longitude };
}

export type ForwardGeocodeHit = GeocodeDetailedResult & {
  displayName: string;
  cityForListings: string | null;
};

export type GeocodeForwardOptions = {
  /** Nominatim `countrycodes` (e.g. `ca`). Omit for worldwide results. */
  countryCodes?: string;
};

/**
 * Forward geocode with display/city fields for map UIs (server-only; respects Nominatim policy).
 */
export async function geocodeForwardWithLabel(
  query: string,
  options?: GeocodeForwardOptions
): Promise<ForwardGeocodeHit | null> {
  const q = query.trim();
  if (q.length < 4) return null;
  const cc = options?.countryCodes?.trim();
  const ccParam = cc ? `&countrycodes=${encodeURIComponent(cc)}` : "";
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=1&q=${encodeURIComponent(q)}${ccParam}`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "LECIPM-RealEstatePlatform/1.0 (contact@example.com)",
        Accept: "application/json",
      },
      next: { revalidate: 0 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as NominatimHit[];
    const first = data[0];
    if (!first) return null;
    const parsed = parseHit(first);
    if (!parsed) return null;
    const addr = first.address;
    const cityForListings =
      addr?.city ?? addr?.town ?? addr?.village ?? addr?.municipality ?? null;
    return {
      ...parsed,
      displayName: first.display_name?.trim() || q,
      cityForListings,
    };
  } catch {
    return null;
  }
}
