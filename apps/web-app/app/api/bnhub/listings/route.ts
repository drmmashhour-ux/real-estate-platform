import { NextRequest } from "next/server";
import { searchListings } from "@/lib/bnhub/listings";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city") ?? undefined;
    const checkIn = searchParams.get("checkIn") ?? undefined;
    const checkOut = searchParams.get("checkOut") ?? undefined;
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const guests = searchParams.get("guests");
    const verifiedOnly = searchParams.get("verifiedOnly") === "true";
    const propertyType = searchParams.get("propertyType") ?? undefined;
    const roomType = searchParams.get("roomType") ?? undefined;
    const instantBook = searchParams.get("instantBook") === "true";
    const sort = searchParams.get("sort") ?? "newest";

    const listings = await searchListings({
      city,
      checkIn,
      checkOut,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      guests: guests ? Number(guests) : undefined,
      verifiedOnly,
      propertyType,
      roomType,
      instantBook: instantBook || undefined,
      sort: sort === "priceAsc" || sort === "priceDesc" || sort === "recommended" ? sort : "newest",
    });

    return Response.json(listings);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to fetch listings" }, { status: 500 });
  }
}
