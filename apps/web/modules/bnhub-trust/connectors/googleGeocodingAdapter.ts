/**
 * Google Geocoding API — requires GOOGLE_MAPS_GEOCODING_API_KEY (server-only).
 */

import type { GeocodingProviderAdapter, GeocodeResult } from "./geocodingProviderTypes";

export class GoogleGeocodingAdapter implements GeocodingProviderAdapter {
  normalizeAddress(raw: string): string {
    return raw.replace(/\s+/g, " ").trim();
  }

  compareAddressComponents(
    listingComponents: { city?: string | null; region?: string | null; country?: string | null },
    geocoded: Record<string, unknown>
  ): { mismatchFlags: string[] } {
    const flags: string[] = [];
    const ac =
      (geocoded.address_components as { long_name: string; short_name?: string; types: string[] }[] | undefined) ??
      [];
    const locality = ac.find((c) => c.types.includes("locality"))?.long_name?.toLowerCase();
    const admin = ac.find((c) => c.types.includes("administrative_area_level_1"))?.long_name?.toLowerCase();
    const country = ac.find((c) => c.types.includes("country"))?.short_name?.toLowerCase();
    if (listingComponents.city && locality && !locality.includes(listingComponents.city.toLowerCase())) {
      flags.push("city_mismatch");
    }
    if (listingComponents.region && admin && !admin.includes(listingComponents.region.toLowerCase())) {
      flags.push("region_mismatch");
    }
    if (listingComponents.country && country && listingComponents.country.toLowerCase() !== country) {
      flags.push("country_mismatch");
    }
    return { mismatchFlags: flags };
  }

  mapConfidence(res: GeocodeResult): number {
    if ("error" in res) return 0;
    switch (res.confidence) {
      case "high":
        return 90;
      case "medium":
        return 60;
      case "low":
        return 35;
      default:
        return 20;
    }
  }

  async geocodeAddress(addressLine: string): Promise<GeocodeResult> {
    const key = process.env.GOOGLE_MAPS_GEOCODING_API_KEY?.trim();
    if (!key) return { error: "Geocoding not configured" };
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("address", addressLine);
    url.searchParams.set("key", key);
    const r = await fetch(url.toString());
    if (!r.ok) return { error: `Geocode HTTP ${r.status}` };
    const data = (await r.json()) as {
      status: string;
      results?: {
        formatted_address: string;
        geometry: { location: { lat: number; lng: number } };
        partial_match?: boolean;
        address_components: { long_name: string; short_name: string; types: string[] }[];
      }[];
    };
    if (data.status !== "OK" || !data.results?.[0]) {
      return { error: data.status === "ZERO_RESULTS" ? "No results" : `Status ${data.status}` };
    }
    const top = data.results[0];
    const partial = Boolean(top.partial_match);
    return {
      normalizedAddress: top.formatted_address,
      latitude: top.geometry.location.lat,
      longitude: top.geometry.location.lng,
      placeMetadata: {
        formatted_address: top.formatted_address,
        partial_match: partial,
        address_components: top.address_components,
      },
      confidence: partial ? "medium" : "high",
    };
  }
}
