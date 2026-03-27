export type GeocodeConfidence = "high" | "medium" | "low" | "unknown";

export type GeocodeResult =
  | {
      normalizedAddress: string;
      latitude: number;
      longitude: number;
      placeMetadata: Record<string, unknown>;
      confidence: GeocodeConfidence;
    }
  | { error: string };

export interface GeocodingProviderAdapter {
  geocodeAddress(addressLine: string): Promise<GeocodeResult>;
  normalizeAddress(raw: string): string;
  compareAddressComponents(
    listingComponents: { city?: string | null; region?: string | null; country?: string | null },
    geocoded: Record<string, unknown>
  ): { mismatchFlags: string[] };
  mapConfidence(raw: GeocodeResult): number;
}
