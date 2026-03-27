/**
 * Forward geocoding via Nominatim (OSM). Use sparingly; respect usage policy / rate limits.
 */

export type GeocodeResult = { latitude: number; longitude: number } | null;

export async function geocodeAddressLine(query: string): Promise<GeocodeResult> {
  const q = query.trim();
  if (q.length < 4) return null;
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "LECIPM-RealEstatePlatform/1.0 (contact@example.com)",
        Accept: "application/json",
      },
      next: { revalidate: 0 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { lat?: string; lon?: string }[];
    const first = data[0];
    if (!first?.lat || !first?.lon) return null;
    const latitude = Number.parseFloat(first.lat);
    const longitude = Number.parseFloat(first.lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    return { latitude, longitude };
  } catch {
    return null;
  }
}
