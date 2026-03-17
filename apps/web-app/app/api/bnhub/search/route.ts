import { NextRequest } from "next/server";
import { SearchService } from "@/lib/bnhub/services";

/**
 * GET /api/bnhub/search — Search BNHub listings.
 * Query: location (city), checkIn, checkOut, guests, minPrice, maxPrice, propertyType, roomType, amenities (comma), instantBook, sort.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get("location") ?? searchParams.get("city") ?? undefined;
    const checkIn = searchParams.get("checkIn") ?? undefined;
    const checkOut = searchParams.get("checkOut") ?? undefined;
    const guests = searchParams.get("guests");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const propertyType = searchParams.get("propertyType") ?? undefined;
    const roomType = searchParams.get("roomType") ?? undefined;
    const instantBook = searchParams.get("instantBook") === "true";
    const verifiedOnly = searchParams.get("verifiedOnly") === "true";
    const sort = searchParams.get("sort") ?? "newest";

    const listings = await SearchService.searchListings({
      city,
      checkIn,
      checkOut,
      guests: guests ? Number(guests) : undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      propertyType,
      roomType,
      instantBook: instantBook || undefined,
      verifiedOnly,
      sort: sort === "priceAsc" || sort === "priceDesc" || sort === "recommended" ? sort : "newest",
    });

    return Response.json(listings);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Search failed" }, { status: 500 });
  }
}
