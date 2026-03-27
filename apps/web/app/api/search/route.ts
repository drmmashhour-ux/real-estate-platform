import { NextRequest } from "next/server";
import { searchListings } from "@/lib/bnhub/listings";
import { getGuestId } from "@/lib/auth/session";
import { trackDemoEvent } from "@/lib/demo-analytics";
import { DemoEvents } from "@/lib/demo-event-types";

/**
 * GET /api/search — Search listings (MVP).
 * Query: location (city), priceMin, priceMax, propertyType (optional), checkIn, checkOut (availability).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawQ = searchParams.get("q");
    const q = typeof rawQ === "string" ? rawQ.trim() : "";
    const locationParam = searchParams.get("location") ?? searchParams.get("city");
    const location = locationParam?.trim() || (q ? q : undefined);
    const priceMin = searchParams.get("priceMin") ?? searchParams.get("minPrice");
    const priceMax = searchParams.get("priceMax") ?? searchParams.get("maxPrice");
    const checkIn = searchParams.get("checkIn") ?? undefined;
    const checkOut = searchParams.get("checkOut") ?? undefined;
    const guests = searchParams.get("guests");
    const sort = searchParams.get("sort") ?? "newest";

    const args = {
      city: location,
      checkIn,
      checkOut,
      minPrice: priceMin ? Number(priceMin) : undefined,
      maxPrice: priceMax ? Number(priceMax) : undefined,
      guests: guests ? Number(guests) : undefined,
      verifiedOnly: searchParams.get("verifiedOnly") === "true",
      sort: sort === "priceAsc" || sort === "priceDesc" || sort === "recommended" ? sort : "newest",
    } as const;

    let listings = await searchListings(args);

    // Guarantee useful results when DB is non-empty:
    // - empty q should already be broad
    // - if q/location yields no rows, fall back to broad search
    if (listings.length === 0 && (q || locationParam)) {
      listings = await searchListings({
        ...args,
        city: undefined,
      });
    }

    if (process.env.NEXT_PUBLIC_ENV === "staging") {
      const uid = await getGuestId().catch(() => null);
      const resultsCount = listings.length;
      const filters = {
        city: args.city,
        checkIn: args.checkIn,
        checkOut: args.checkOut,
        minPrice: args.minPrice,
        maxPrice: args.maxPrice,
        guests: args.guests,
        verifiedOnly: args.verifiedOnly,
        sort: args.sort,
      };
      void trackDemoEvent(
        DemoEvents.SEARCH,
        { query: q || location || "", filters, resultsCount },
        uid
      );
    }

    return Response.json(listings);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Search failed" }, { status: 500 });
  }
}
