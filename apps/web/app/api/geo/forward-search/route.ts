import { NextRequest, NextResponse } from "next/server";
import { geocodeForwardWithLabel } from "@/lib/geo/geocode-nominatim";

export const dynamic = "force-dynamic";

/**
 * Server-side forward geocode for map focus (avoids browser CORS and keeps a proper User-Agent).
 * Does not persist; callers should debounce. See Nominatim usage policy.
 * Optional `cc` (e.g. `ca`) restricts to that country; omit for worldwide (default for listing map focus).
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 4) {
    return NextResponse.json({ ok: false, error: "query_too_short" }, { status: 400 });
  }
  const cc = req.nextUrl.searchParams.get("cc")?.trim() || undefined;
  const hit = await geocodeForwardWithLabel(q, cc ? { countryCodes: cc } : undefined);
  if (!hit) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({
    ok: true,
    lat: hit.latitude,
    lon: hit.longitude,
    bbox: hit.boundingBox,
    displayName: hit.displayName,
    cityForListings: hit.cityForListings,
  });
}
