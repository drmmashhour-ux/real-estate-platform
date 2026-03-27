import { NextRequest, NextResponse } from "next/server";
import { getListingById, updateListing } from "@/lib/bnhub/listings";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

function clientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "anonymous"
  );
}

/** GET /api/listings/:id — Get one listing (MVP alias). */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ip = clientIp(request);
    const limit = checkRateLimit(`public:listing-detail-alias:${ip}`, { windowMs: 60_000, max: 120 });
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429, headers: getRateLimitHeaders(limit) }
      );
    }
    const { id } = await params;
    const listing = await getListingById(id);
    if (!listing) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json(listing);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to fetch listing" }, { status: 500 });
  }
}

/** PUT /api/listings/:id — Update listing (MVP alias; uses PATCH semantics). */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data: Record<string, unknown> = {};
    if (body.title != null) data.title = body.title;
    if (body.description != null) data.description = body.description;
    if (body.address != null) data.address = body.address;
    if (body.city != null) data.city = body.city;
    if (body.country != null) data.country = body.country;
    if (body.nightPriceCents != null) data.nightPriceCents = body.nightPriceCents;
    if (body.beds != null) data.beds = body.beds;
    if (body.baths != null) data.baths = body.baths;
    if (body.maxGuests != null) data.maxGuests = body.maxGuests;
    if (Array.isArray(body.photos)) data.photos = body.photos;
    if (Array.isArray(body.amenities)) data.amenities = body.amenities;
    if (body.houseRules !== undefined) data.houseRules = body.houseRules;
    const listing = await updateListing(id, data);
    return Response.json(listing);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to update listing" }, { status: 500 });
  }
}
