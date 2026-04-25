import {
  listPublicBnhubListingsFiltered,
  type PublicListingsQuery,
} from "@/lib/bnhub/public-supabase-listings-read";
import { mergeTrustSnapshotsOntoListingIds } from "@/lib/bnhub/two-sided-trust-sync";

export const dynamic = "force-dynamic";

function parseOptNum(v: string | null): number | null {
  if (v == null || v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function parseOptInt(v: string | null): number | null {
  if (v == null || v.trim() === "") return null;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}

function parseAmenities(searchParams: URLSearchParams): string[] {
  const parts = searchParams.getAll("amenities");
  const out: string[] = [];
  for (const p of parts) {
    for (const s of p.split(",")) {
      const t = s.trim();
      if (t) out.push(t);
    }
  }
  return [...new Set(out)].slice(0, 24);
}

/** GET /api/bnhub/public/listings — guest browse with search, price, geo, and Booking.com–style filters. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query: PublicListingsQuery = {
    q: searchParams.get("q"),
    minPrice: parseOptNum(searchParams.get("minPrice")),
    maxPrice: parseOptNum(searchParams.get("maxPrice")),
    lat: parseOptNum(searchParams.get("lat")),
    lng: parseOptNum(searchParams.get("lng")),
    radiusKm: parseOptNum(searchParams.get("radiusKm")),
    propertyType: searchParams.get("propertyType")?.trim() || null,
    guests: parseOptInt(searchParams.get("guests")),
    bedrooms: parseOptInt(searchParams.get("bedrooms")),
    bathrooms: parseOptNum(searchParams.get("bathrooms")),
    minRating: parseOptInt(searchParams.get("minRating")),
    amenities: parseAmenities(searchParams),
    country: searchParams.get("country")?.trim() || null,
    city: searchParams.get("city")?.trim() || null,
  };

  const result = await listPublicBnhubListingsFiltered(query);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }
  const withTrust = await mergeTrustSnapshotsOntoListingIds(result.listings);
  return Response.json({ listings: withTrust, total: withTrust.length });
}
