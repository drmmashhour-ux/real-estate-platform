/**
 * Street View Static / metadata — reference capture for future CV compare.
 */

export type StreetViewComparisonStatus =
  | "not_run"
  | "pending"
  | "matched"
  | "weak_match"
  | "no_reference"
  | "failed"
  | "review_required";

export class StreetViewAdapter {
  buildStaticImageUrl(params: {
    lat: number;
    lng: number;
    width?: number;
    height?: number;
  }): string | null {
    const key = process.env.GOOGLE_MAPS_STREETVIEW_KEY?.trim() ?? process.env.GOOGLE_MAPS_GEOCODING_API_KEY?.trim();
    if (!key) return null;
    const w = params.width ?? 400;
    const h = params.height ?? 300;
    const u = new URL("https://maps.googleapis.com/maps/api/streetview");
    u.searchParams.set("size", `${w}x${h}`);
    u.searchParams.set("location", `${params.lat},${params.lng}`);
    u.searchParams.set("key", key);
    return u.toString();
  }

  async fetchStreetViewMetadataIfSupported(lat: number, lng: number): Promise<{ status: string; panoId?: string } | null> {
    const key = process.env.GOOGLE_MAPS_STREETVIEW_KEY?.trim() ?? process.env.GOOGLE_MAPS_GEOCODING_API_KEY?.trim();
    if (!key) return null;
    const u = new URL("https://maps.googleapis.com/maps/api/streetview/metadata");
    u.searchParams.set("location", `${lat},${lng}`);
    u.searchParams.set("key", key);
    const r = await fetch(u.toString());
    if (!r.ok) return { status: "failed" };
    const j = (await r.json()) as { status: string; pano_id?: string };
    return { status: j.status, panoId: j.pano_id };
  }

  compareExteriorEvidencePlaceholder(): StreetViewComparisonStatus {
    return "no_reference";
  }

  mapComparisonStatus(s: StreetViewComparisonStatus): StreetViewComparisonStatus {
    return s;
  }
}
