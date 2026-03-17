import { NextRequest } from "next/server";
import { searchListings } from "@/lib/bnhub/listings";

/**
 * GET /api/search — Search listings (MVP).
 * Query: location (city), priceMin, priceMax, propertyType (optional), checkIn, checkOut (availability).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get("location") ?? searchParams.get("city") ?? undefined;
    const priceMin = searchParams.get("priceMin") ?? searchParams.get("minPrice");
    const priceMax = searchParams.get("priceMax") ?? searchParams.get("maxPrice");
    const checkIn = searchParams.get("checkIn") ?? undefined;
    const checkOut = searchParams.get("checkOut") ?? undefined;
    const guests = searchParams.get("guests");
    const sort = searchParams.get("sort") ?? "newest";

    const listings = await searchListings({
      city: location,
      checkIn,
      checkOut,
      minPrice: priceMin ? Number(priceMin) : undefined,
      maxPrice: priceMax ? Number(priceMax) : undefined,
      guests: guests ? Number(guests) : undefined,
      verifiedOnly: searchParams.get("verifiedOnly") === "true",
      sort: sort === "priceAsc" || sort === "priceDesc" || sort === "recommended" ? sort : "newest",
    });
    return Response.json(listings);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Search failed" }, { status: 500 });
  }
}
